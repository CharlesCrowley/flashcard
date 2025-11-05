import { Router, Request, Response } from 'express';
import { db, cards, decks, reviews } from '../db';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';
import { fsrsService } from '../services/fsrs.service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createCardSchema = z.object({
  deckId: z.string().uuid(),
  word: z.string().min(1),
  definition: z.string().default(''),
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

    let query = db
      .select({
        id: cards.id,
        deckId: cards.deckId,
        word: cards.word,
        definition: cards.definition,
        pronunciation: cards.pronunciation,
        audioUrl: cards.audioUrl,
        imageUrl: cards.imageUrl,
        drawingData: cards.drawingData,
        exampleSentences: cards.exampleSentences,
        translation: cards.translation,
        partOfSpeech: cards.partOfSpeech,
        tags: cards.tags,
        due: cards.due,
        stability: cards.stability,
        difficulty: cards.difficulty,
        elapsedDays: cards.elapsedDays,
        scheduledDays: cards.scheduledDays,
        reps: cards.reps,
        lapses: cards.lapses,
        state: cards.state,
        lastReview: cards.lastReview,
        createdAt: cards.createdAt,
        updatedAt: cards.updatedAt,
        deckName: decks.name,
        deckIdRef: decks.id,
      })
      .from(cards)
      .leftJoin(decks, eq(cards.deckId, decks.id))
      .$dynamic();

    // Apply filters
    const conditions = [];
    if (deckId) conditions.push(eq(cards.deckId, deckId as string));
    if (tag) conditions.push(sql`${tag} = ANY(${cards.tags})`);
    if (search) {
      conditions.push(
        or(
          ilike(cards.word, `%${search}%`),
          ilike(cards.definition, `%${search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(cards.createdAt));

    // Transform results
    const formattedCards = result.map((row) => {
      const { deckName, deckIdRef, ...cardData } = row;
      return {
        ...cardData,
        deck: deckName && deckIdRef ? { id: deckIdRef, name: deckName } : null,
      };
    });

    res.json(formattedCards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// GET /api/cards/:id - Get specific card
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, id))
      .limit(1);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get deck info
    const [deckInfo] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, card.deckId))
      .limit(1);

    // Get recent reviews
    const recentReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.cardId, id))
      .orderBy(desc(reviews.reviewedAt))
      .limit(10);

    res.json({
      ...card,
      deck: deckInfo,
      reviews: recentReviews,
    });
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

    const [newCard] = await db
      .insert(cards)
      .values({
        ...data,
        ...fsrsData,
      })
      .returning();

    // Get deck info
    const [deckInfo] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, newCard.deckId))
      .limit(1);

    res.status(201).json({
      ...newCard,
      deck: deckInfo,
    });
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

    const [updatedCard] = await db
      .update(cards)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id))
      .returning();

    if (!updatedCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get deck info
    const [deckInfo] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, updatedCard.deckId))
      .limit(1);

    res.json({
      ...updatedCard,
      deck: deckInfo,
    });
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

    await db.delete(cards).where(eq(cards.id, id));

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

    const [card] = await db
      .select({
        reps: cards.reps,
        lapses: cards.lapses,
        state: cards.state,
        due: cards.due,
        stability: cards.stability,
        difficulty: cards.difficulty,
      })
      .from(cards)
      .where(eq(cards.id, id))
      .limit(1);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const cardReviews = await db
      .select({
        rating: reviews.rating,
        reviewedAt: reviews.reviewedAt,
        timeSpent: reviews.timeSpent,
      })
      .from(reviews)
      .where(eq(reviews.cardId, id))
      .orderBy(reviews.reviewedAt);

    const stats = {
      ...card,
      totalReviews: cardReviews.length,
      averageRating: cardReviews.length > 0
        ? cardReviews.reduce((sum, r) => sum + r.rating, 0) / cardReviews.length
        : 0,
      averageTimeSpent: cardReviews.length > 0
        ? cardReviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / cardReviews.length
        : 0,
      reviewHistory: cardReviews,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching card stats:', error);
    res.status(500).json({ error: 'Failed to fetch card statistics' });
  }
});

export default router;
