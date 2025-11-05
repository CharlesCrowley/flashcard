import fetch from 'node-fetch';

/**
 * DeepL Translation Service
 */

export class TranslateService {
  private apiKey: string;
  private baseUrl = 'https://api-free.deepl.com/v2'; // Use api.deepl.com for paid plans

  constructor() {
    this.apiKey = process.env.DEEPL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('DEEPL_API_KEY not set, translation features will be disabled');
    }
  }

  /**
   * Translate text to target language
   * @param text - Text to translate
   * @param targetLang - Target language code (e.g., 'ES', 'FR', 'DE')
   * @param sourceLang - Source language (default: 'EN')
   */
  async translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'EN'
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepL API key not configured');
    }

    const url = `${this.baseUrl}/translate`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text,
          target_lang: targetLang.toUpperCase(),
          source_lang: sourceLang.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      return data.translations?.[0]?.text || '';
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Translate multiple texts in one request (more efficient)
   */
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string = 'EN'
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('DeepL API key not configured');
    }

    const url = `${this.baseUrl}/translate`;

    try {
      const params = new URLSearchParams({
        target_lang: targetLang.toUpperCase(),
        source_lang: sourceLang.toUpperCase(),
      });

      // Add multiple text parameters
      texts.forEach(text => params.append('text', text));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      return data.translations?.map((t: any) => t.text) || [];
    } catch (error) {
      console.error('Batch translation failed:', error);
      throw new Error('Failed to translate texts');
    }
  }

  /**
   * Get supported target languages
   */
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    if (!this.apiKey) {
      // Return common languages if API key not configured
      return [
        { code: 'ES', name: 'Spanish' },
        { code: 'FR', name: 'French' },
        { code: 'DE', name: 'German' },
        { code: 'IT', name: 'Italian' },
        { code: 'PT', name: 'Portuguese' },
        { code: 'ZH', name: 'Chinese' },
        { code: 'JA', name: 'Japanese' },
        { code: 'KO', name: 'Korean' },
      ];
    }

    const url = `${this.baseUrl}/languages?type=target`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status}`);
      }

      const languages = await response.json() as any[];
      return languages.map(lang => ({
        code: lang.language,
        name: lang.name,
      }));
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      throw new Error('Failed to get supported languages');
    }
  }

  /**
   * Check API usage (for monitoring quota)
   */
  async getUsage(): Promise<{ count: number; limit: number }> {
    if (!this.apiKey) {
      throw new Error('DeepL API key not configured');
    }

    const url = `${this.baseUrl}/usage`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        count: data.character_count || 0,
        limit: data.character_limit || 0,
      };
    } catch (error) {
      console.error('Failed to get usage:', error);
      throw new Error('Failed to get API usage');
    }
  }
}

export const translateService = new TranslateService();
