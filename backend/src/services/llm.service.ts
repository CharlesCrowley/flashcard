import Groq from 'groq-sdk';

/**
 * LLM Service for content generation
 * Uses Llama 3.3 70b via Groq API
 */

export class LLMService {
  private groq: Groq;
  private model = 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not set, LLM features will be disabled');
    }
    this.groq = new Groq({ apiKey: apiKey || '' });
  }

  /**
   * Generate a learner-friendly definition for a word
   */
  async generateDefinition(word: string, context?: string): Promise<string> {
    const prompt = `As an ESL teacher, provide a clear, simple definition for the word "${word}"${context ? ` in the context: "${context}"` : ''}.
Keep it concise (1-2 sentences) and use simple language suitable for intermediate English learners.
Do not include the word itself in the definition.`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert ESL teacher who explains vocabulary clearly and simply.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.3,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('LLM definition generation failed:', error);
      throw new Error('Failed to generate definition');
    }
  }

  /**
   * Generate example sentences for a word
   */
  async generateExamples(word: string, count: number = 3): Promise<string[]> {
    const prompt = `Generate ${count} example sentences using the word "${word}".
Requirements:
- Each sentence should be simple and clear for ESL students (A2-B1 level)
- Show different contexts or meanings of the word
- Keep sentences between 8-15 words
- Use common vocabulary
- Return only the sentences, one per line, without numbering`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert ESL teacher creating example sentences for vocabulary learning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content?.trim() || '';
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, count);
    } catch (error) {
      console.error('LLM example generation failed:', error);
      throw new Error('Failed to generate examples');
    }
  }

  /**
   * Generate both definition and examples in one call (more efficient)
   */
  async generateContent(word: string): Promise<{
    definition: string;
    examples: string[];
  }> {
    const prompt = `For the word "${word}", provide:
1. A simple, clear definition (1-2 sentences, suitable for ESL intermediate learners)
2. Three example sentences showing how to use the word

Format your response as:
DEFINITION: [your definition here]
EXAMPLES:
- [example 1]
- [example 2]
- [example 3]`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert ESL teacher helping students learn vocabulary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.5,
        max_tokens: 400,
      });

      const response = completion.choices[0]?.message?.content?.trim() || '';

      // Parse response
      const definitionMatch = response.match(/DEFINITION:\s*(.+?)(?=EXAMPLES:)/s);
      const examplesMatch = response.match(/EXAMPLES:\s*([\s\S]+)/);

      const definition = definitionMatch?.[1]?.trim() || '';
      const examples = examplesMatch?.[1]
        ?.split('\n')
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0) || [];

      return { definition, examples };
    } catch (error) {
      console.error('LLM content generation failed:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Improve or simplify a definition for ESL learners
   */
  async simplifyDefinition(definition: string): Promise<string> {
    const prompt = `Simplify this definition for ESL intermediate learners (A2-B1 level):
"${definition}"

Make it clearer and use simpler words while keeping the meaning accurate.`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert ESL teacher who simplifies complex definitions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.3,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || definition;
    } catch (error) {
      console.error('LLM simplification failed:', error);
      return definition; // Return original on error
    }
  }
}

export const llmService = new LLMService();
