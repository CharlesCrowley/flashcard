import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { fsrsService } from '../services/fsrs.service';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createCardSchema = z.object({
  deckId: z.string().uuid(),
  word: z.string().min(1),
  definition: z.string().optional(),
  pronunciation: z.string().optional(),
  audioUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  drawingData: z.string().optional(),
  exampleSentences: z.array(z.string()).optional().default([]),
  translation: z.string().optional(),
  partOfSpeech: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const updateCardSchema = createCardSchema.partial();

// GET /api/cards - Get all cards (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { deckId, tag, search } = req.query;

    const where: any = {};
    if (deckId) where.deckId = deckId as string;
    if (tag) where.tags = { has: tag as string };
    if (search) {
      where.OR = [
        { word: { contains: search as string, mode: 'insensitive' } },
        { definition: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const cards = await prisma.card.findMany({
      where,
      include: {
        deck: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// GET /api/cards/:id - Get specific card
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        deck: true,
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// POST /api/cards - Create new card
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createCardSchema.parse(req.body);

    // Initialize FSRS data for new card
    const fsrsCard = fsrsService.createNewCard();
    const fsrsData = fsrsService.fromFSRSCard(fsrsCard);

    const card = await prisma.card.create({
      data: {
        ...data,
        ...fsrsData,
      },
      include: {
        deck: true,
      },
    });

    res.status(201).json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// PUT /api/cards/:id - Update card
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCardSchema.parse(req.body);

    const card = await prisma.card.update({
      where: { id },
      data,
      include: {
        deck: true,
      },
    });

    res.json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// DELETE /api/cards/:id - Delete card
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.card.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// GET /api/cards/:id/stats - Get card statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findUnique({
      where: { id },
      select: {
        reps: true,
        lapses: true,
        state: true,
        due: true,
        stability: true,
        difficulty: true,
      },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { cardId: id },
      orderBy: { reviewedAt: 'asc' },
      select: {
        rating: true,
        reviewedAt: true,
        timeSpent: true,
      },
    });

    const stats = {
      ...card,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      averageTimeSpent: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / reviews.length
        : 0,
      reviewHistory: reviews,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching card stats:', error);
    res.status(500).json({ error: 'Failed to fetch card statistics' });
  }
});

export default router;
