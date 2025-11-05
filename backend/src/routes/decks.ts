import { Router, Request, Response } from 'express';
import { db, decks, cards } from '../db';
import { eq, desc, count } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

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

    let query = db
      .select({
        deck: decks,
        cardCount: count(cards.id),
      })
      .from(decks)
      .leftJoin(cards, eq(decks.id, cards.deckId))
      .groupBy(decks.id)
      .$dynamic();

    if (userId) {
      query = query.where(eq(decks.userId, userId as string));
    }

    const result = await query.orderBy(desc(decks.updatedAt));

    // Transform results
    const formattedDecks = result.map((row) => ({
      ...row.deck,
      _count: {
        cards: row.cardCount,
      },
    }));

    res.json(formattedDecks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// GET /api/decks/:id - Get specific deck
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deck] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, id))
      .limit(1);

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Get cards in this deck
    const deckCards = await db
      .select()
      .from(cards)
      .where(eq(cards.deckId, id))
      .orderBy(desc(cards.createdAt))
      .limit(100);

    res.json({
      ...deck,
      cards: deckCards,
      _count: {
        cards: deckCards.length,
      },
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// POST /api/decks - Create new deck
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createDeckSchema.parse(req.body);

    const [newDeck] = await db
      .insert(decks)
      .values(data)
      .returning();

    res.status(201).json({
      ...newDeck,
      _count: {
        cards: 0,
      },
    });
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

    const [updatedDeck] = await db
      .update(decks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, id))
      .returning();

    if (!updatedDeck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Get card count
    const [{ cardCount }] = await db
      .select({ cardCount: count(cards.id) })
      .from(cards)
      .where(eq(cards.deckId, id));

    res.json({
      ...updatedDeck,
      _count: {
        cards: cardCount,
      },
    });
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

    await db.delete(decks).where(eq(decks.id, id));

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

    const deckCards = await db
      .select({
        state: cards.state,
        due: cards.due,
        reps: cards.reps,
        lapses: cards.lapses,
      })
      .from(cards)
      .where(eq(cards.deckId, id));

    if (deckCards.length === 0) {
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
      total: deckCards.length,
      new: deckCards.filter(c => c.state === 0).length,
      learning: deckCards.filter(c => c.state === 1).length,
      review: deckCards.filter(c => c.state === 2).length,
      due: deckCards.filter(c => c.due <= now).length,
      mastery: deckCards.filter(c => c.reps >= 5 && c.lapses === 0).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ error: 'Failed to fetch deck statistics' });
  }
});

export default router;
