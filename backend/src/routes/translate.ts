import { Router, Request, Response } from 'express';
import { translateService } from '../services/translate.service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const translateSchema = z.object({
  text: z.string().min(1),
  targetLang: z.string().length(2),
  sourceLang: z.string().length(2).optional().default('EN'),
});

const translateBatchSchema = z.object({
  texts: z.array(z.string().min(1)),
  targetLang: z.string().length(2),
  sourceLang: z.string().length(2).optional().default('EN'),
});

// POST /api/translate - Translate text
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, targetLang, sourceLang } = translateSchema.parse(req.body);

    const translation = await translateService.translate(text, targetLang, sourceLang);

    res.json({
      original: text,
      translation,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

// POST /api/translate/batch - Translate multiple texts
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { texts, targetLang, sourceLang } = translateBatchSchema.parse(req.body);

    const translations = await translateService.translateBatch(texts, targetLang, sourceLang);

    res.json({
      translations: texts.map((text, index) => ({
        original: text,
        translation: translations[index],
      })),
      sourceLang,
      targetLang,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Batch translation error:', error);
    res.status(500).json({ error: 'Failed to translate texts' });
  }
});

// GET /api/translate/languages - Get supported languages
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const languages = await translateService.getSupportedLanguages();
    res.json(languages);
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to get supported languages' });
  }
});

// GET /api/translate/usage - Get API usage
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const usage = await translateService.getUsage();
    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get API usage' });
  }
});

export default router;
