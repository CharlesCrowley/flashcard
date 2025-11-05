import { Router, Request, Response } from 'express';
import { llmService } from '../services/llm.service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateDefinitionSchema = z.object({
  word: z.string().min(1),
  context: z.string().optional(),
});

const generateExamplesSchema = z.object({
  word: z.string().min(1),
  count: z.number().int().min(1).max(10).optional().default(3),
});

const generateContentSchema = z.object({
  word: z.string().min(1),
});

const simplifyDefinitionSchema = z.object({
  definition: z.string().min(1),
});

// POST /api/generate/definition - Generate AI definition
router.post('/definition', async (req: Request, res: Response) => {
  try {
    const { word, context } = generateDefinitionSchema.parse(req.body);

    const definition = await llmService.generateDefinition(word, context);

    res.json({ word, definition });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Definition generation error:', error);
    res.status(500).json({ error: 'Failed to generate definition' });
  }
});

// POST /api/generate/examples - Generate AI example sentences
router.post('/examples', async (req: Request, res: Response) => {
  try {
    const { word, count } = generateExamplesSchema.parse(req.body);

    const examples = await llmService.generateExamples(word, count);

    res.json({ word, examples });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Examples generation error:', error);
    res.status(500).json({ error: 'Failed to generate examples' });
  }
});

// POST /api/generate/content - Generate both definition and examples
router.post('/content', async (req: Request, res: Response) => {
  try {
    const { word } = generateContentSchema.parse(req.body);

    const content = await llmService.generateContent(word);

    res.json({ word, ...content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Content generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// POST /api/generate/simplify - Simplify a definition
router.post('/simplify', async (req: Request, res: Response) => {
  try {
    const { definition } = simplifyDefinitionSchema.parse(req.body);

    const simplified = await llmService.simplifyDefinition(definition);

    res.json({ original: definition, simplified });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Simplification error:', error);
    res.status(500).json({ error: 'Failed to simplify definition' });
  }
});

export default router;
