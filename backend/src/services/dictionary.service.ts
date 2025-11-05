import fetch from 'node-fetch';

/**
 * Dictionary Service
 * Integrates with Merriam-Webster Learner's Dictionary (primary)
 * and Free Dictionary API (fallback)
 */

interface DictionaryResult {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  definitions: Array<{
    partOfSpeech: string;
    definition: string;
    example?: string;
  }>;
  examples: string[];
  synonyms: string[];
}

export class DictionaryService {
  private mwApiKey: string;
  private requestCount = 0;
  private resetTime = Date.now() + 24 * 60 * 60 * 1000;

  constructor() {
    this.mwApiKey = process.env.MERRIAM_WEBSTER_API_KEY || '';
  }

  /**
   * Get dictionary definition for a word
   * Tries MW Learner's first, falls back to Free Dictionary
   */
  async getDefinition(word: string): Promise<DictionaryResult | null> {
    // Try Merriam-Webster Learner's Dictionary first (ESL-focused)
    if (this.mwApiKey && this.canMakeMWRequest()) {
      try {
        const result = await this.getMerriamWebsterDefinition(word);
        if (result) {
          this.requestCount++;
          return result;
        }
      } catch (error) {
        console.warn('MW API failed, falling back to Free Dictionary:', error);
      }
    }

    // Fallback to Free Dictionary API
    try {
      return await this.getFreeDictionaryDefinition(word);
    } catch (error) {
      console.error('All dictionary APIs failed:', error);
      return null;
    }
  }

  /**
   * Merriam-Webster Learner's Dictionary API
   */
  private async getMerriamWebsterDefinition(word: string): Promise<DictionaryResult | null> {
    const url = `https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(word)}?key=${this.mwApiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MW API error: ${response.status}`);
    }

    const data = await response.json() as any[];

    // Check if word was found (not just suggestions)
    if (!data || data.length === 0 || typeof data[0] === 'string') {
      return null;
    }

    const entry = data[0];
    const definitions: DictionaryResult['definitions'] = [];
    const examples: string[] = [];

    // Extract definitions
    if (entry.def && entry.def[0] && entry.def[0].sseq) {
      for (const sense of entry.def[0].sseq) {
        if (sense[0] && sense[0][1]) {
          const def = sense[0][1];
          if (def.dt) {
            for (const item of def.dt) {
              if (item[0] === 'text') {
                const definition = item[1].replace(/\{.*?\}/g, ''); // Remove markup
                definitions.push({
                  partOfSpeech: entry.fl || 'unknown',
                  definition,
                  example: undefined
                });
              } else if (item[0] === 'vis') {
                // Extract example sentences
                for (const vis of item[1]) {
                  if (vis.t) {
                    const example = vis.t.replace(/\{.*?\}/g, '');
                    examples.push(example);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Get pronunciation
    let phonetic: string | undefined;
    let audioUrl: string | undefined;

    if (entry.hwi && entry.hwi.prs && entry.hwi.prs[0]) {
      phonetic = entry.hwi.prs[0].ipa || entry.hwi.prs[0].mw;

      if (entry.hwi.prs[0].sound && entry.hwi.prs[0].sound.audio) {
        const audio = entry.hwi.prs[0].sound.audio;
        const subdir = this.getMWAudioSubdirectory(audio);
        audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdir}/${audio}.mp3`;
      }
    }

    return {
      word: entry.meta?.id?.split(':')[0] || word,
      phonetic,
      audioUrl,
      definitions,
      examples,
      synonyms: []
    };
  }

  /**
   * Free Dictionary API (fallback, no rate limits)
   */
  private async getFreeDictionaryDefinition(word: string): Promise<DictionaryResult | null> {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Word not found
      }
      throw new Error(`Free Dictionary API error: ${response.status}`);
    }

    const data = await response.json() as any[];
    const entry = data[0];

    const definitions: DictionaryResult['definitions'] = [];
    const examples: string[] = [];
    const synonyms: string[] = [];

    // Extract definitions and examples
    for (const meaning of entry.meanings || []) {
      for (const def of meaning.definitions || []) {
        definitions.push({
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example
        });

        if (def.example) {
          examples.push(def.example);
        }

        if (def.synonyms) {
          synonyms.push(...def.synonyms);
        }
      }
    }

    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
      audioUrl: entry.phonetics?.find((p: any) => p.audio)?.audio,
      definitions,
      examples,
      synonyms: [...new Set(synonyms)] // Remove duplicates
    };
  }

  /**
   * Helper to determine MW audio subdirectory
   */
  private getMWAudioSubdirectory(audio: string): string {
    if (audio.startsWith('bix')) return 'bix';
    if (audio.startsWith('gg')) return 'gg';
    if (/^[0-9]/.test(audio)) return 'number';
    return audio[0];
  }

  /**
   * Rate limiting for MW API (1000/day free tier)
   */
  private canMakeMWRequest(): boolean {
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 24 * 60 * 60 * 1000;
    }
    return this.requestCount < 1000;
  }
}

export const dictionaryService = new DictionaryService();
