import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createDeckSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().uuid(),
});

const updateDeckSchema = createDeckSchema.partial().omit({ userId: true });

// GET /api/decks - Get all decks
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const where = userId ? { userId: userId as string } : {};

    const decks = await prisma.deck.findMany({
      where,
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// GET /api/decks/:id - Get specific deck
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit for performance
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// POST /api/decks - Create new deck
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createDeckSchema.parse(req.body);

    const deck = await prisma.deck.create({
      data,
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    res.status(201).json(deck);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating deck:', error);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

// PUT /api/decks/:id - Update deck
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateDeckSchema.parse(req.body);

    const deck = await prisma.deck.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    res.json(deck);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating deck:', error);
    res.status(500).json({ error: 'Failed to update deck' });
  }
});

// DELETE /api/decks/:id - Delete deck
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.deck.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

// GET /api/decks/:id/stats - Get deck statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cards = await prisma.card.findMany({
      where: { deckId: id },
      select: {
        state: true,
        due: true,
        reps: true,
        lapses: true,
      },
    });

    if (cards.length === 0) {
      return res.json({
        total: 0,
        new: 0,
        learning: 0,
        review: 0,
        due: 0,
        mastery: 0,
      });
    }

    const now = new Date();

    const stats = {
      total: cards.length,
      new: cards.filter(c => c.state === 0).length,
      learning: cards.filter(c => c.state === 1).length,
      review: cards.filter(c => c.state === 2).length,
      due: cards.filter(c => c.due <= now).length,
      mastery: cards.filter(c => c.reps >= 5 && c.lapses === 0).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ error: 'Failed to fetch deck statistics' });
  }
});

export default router;
