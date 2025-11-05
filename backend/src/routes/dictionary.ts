import { Router, Request, Response } from 'express';
import { dictionaryService } from '../services/dictionary.service';

const router = Router();

// GET /api/dictionary/:word - Get dictionary definition
router.get('/:word', async (req: Request, res: Response) => {
  try {
    const { word } = req.params;

    if (!word || word.trim().length === 0) {
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    const result = await dictionaryService.getDefinition(word.trim().toLowerCase());

    if (!result) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup word' });
  }
});

export default router;
