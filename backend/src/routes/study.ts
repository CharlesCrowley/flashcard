import { Router, Request, Response } from 'express';
import { db, cards, reviews, studySessions, decks } from '../db';
import { eq, lte, and, desc, asc, count, sum, sql } from 'drizzle-orm';
import { fsrsService } from '../services/fsrs.service';
import { Rating } from 'fsrs';
import { z } from 'zod';

const router = Router();

// Validation schemas
const reviewSchema = z.object({
  cardId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(4), // 1=Again, 2=Hard, 3=Good, 4=Easy
  timeSpent: z.number().int().positive().optional(),
});

// GET /api/study/due - Get cards due for review
router.get('/due', async (req: Request, res: Response) => {
  try {
    const { deckId, limit = '20' } = req.query;

    const conditions = [
      lte(cards.due, new Date()),
    ];

    if (deckId) {
      conditions.push(eq(cards.deckId, deckId as string));
    }

    const dueCards = await db
      .select({
        card: cards,
        deck: {
          id: decks.id,
          name: decks.name,
        },
      })
      .from(cards)
      .leftJoin(decks, eq(cards.deckId, decks.id))
      .where(and(...conditions))
      .orderBy(asc(cards.due), asc(cards.state))
      .limit(parseInt(limit as string));

    // For each card, calculate next review options
    const cardsWithOptions = dueCards.map((row) => {
      const card = row.card;
      const fsrsCard = fsrsService.toFSRSCard(card);
      const options = fsrsService.getReviewOptions(fsrsCard);

      return {
        ...card,
        deck: row.deck,
        nextReview: {
          again: {
            interval: Math.round(options.again.card.scheduled_days),
            due: options.again.card.due,
          },
          hard: {
            interval: Math.round(options.hard.card.scheduled_days),
            due: options.hard.card.due,
          },
          good: {
            interval: Math.round(options.good.card.scheduled_days),
            due: options.good.card.due,
          },
          easy: {
            interval: Math.round(options.easy.card.scheduled_days),
            due: options.easy.card.due,
          },
        },
      };
    });

    res.json({
      cards: cardsWithOptions,
      total: cardsWithOptions.length,
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

// POST /api/study/review - Submit review and update card schedule
router.post('/review', async (req: Request, res: Response) => {
  try {
    const { cardId, userId, rating, timeSpent } = reviewSchema.parse(req.body);

    // Get current card state
    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Calculate next review using FSRS
    const fsrsCard = fsrsService.toFSRSCard(card);
    const nextReview = fsrsService.getNextReview(fsrsCard, rating as Rating);
    const updatedFsrsData = fsrsService.fromFSRSCard(nextReview.card);

    // Update card in database
    const [updatedCard] = await db
      .update(cards)
      .set(updatedFsrsData)
      .where(eq(cards.id, cardId))
      .returning();

    // Create review record
    const [review] = await db
      .insert(reviews)
      .values({
        cardId,
        userId,
        rating,
        timeSpent,
        reviewedAt: new Date(),
      })
      .returning();

    res.json({
      card: updatedCard,
      review,
      nextDue: updatedCard.due,
      interval: updatedCard.scheduledDays,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/study/stats - Get study statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId, deckId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Build conditions for reviews query
    const reviewConditions = [eq(reviews.userId, userId as string)];

    // Get all reviews for the user
    const userReviews = await db
      .select({
        id: reviews.id,
        cardId: reviews.cardId,
        rating: reviews.rating,
        reviewedAt: reviews.reviewedAt,
        timeSpent: reviews.timeSpent,
      })
      .from(reviews)
      .where(and(...reviewConditions));

    // Filter by deck if provided
    let filteredReviews = userReviews;
    if (deckId) {
      const deckCardIds = await db
        .select({ id: cards.id })
        .from(cards)
        .where(eq(cards.deckId, deckId as string));

      const deckCardIdSet = new Set(deckCardIds.map(c => c.id));
      filteredReviews = userReviews.filter(r => deckCardIdSet.has(r.cardId));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReviews = filteredReviews.filter(r => r.reviewedAt >= today);

    // Calculate statistics
    const stats = {
      total: {
        reviews: filteredReviews.length,
        cards: new Set(filteredReviews.map(r => r.cardId)).size,
      },
      today: {
        reviews: todayReviews.length,
        cards: new Set(todayReviews.map(r => r.cardId)).size,
        timeSpent: todayReviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      },
      ratings: {
        again: filteredReviews.filter(r => r.rating === 1).length,
        hard: filteredReviews.filter(r => r.rating === 2).length,
        good: filteredReviews.filter(r => r.rating === 3).length,
        easy: filteredReviews.filter(r => r.rating === 4).length,
      },
      averageRating: filteredReviews.length > 0
        ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
        : 0,
    };

    // Get cards by state
    const cardConditions = [];
    if (deckId) cardConditions.push(eq(cards.deckId, deckId as string));

    const allCards = await db
      .select({
        state: cards.state,
        due: cards.due,
      })
      .from(cards)
      .where(cardConditions.length > 0 ? and(...cardConditions) : undefined);

    const cardStats = {
      new: allCards.filter(c => c.state === 0).length,
      learning: allCards.filter(c => c.state === 1).length,
      review: allCards.filter(c => c.state === 2).length,
      relearning: allCards.filter(c => c.state === 3).length,
      due: allCards.filter(c => c.due <= new Date()).length,
    };

    res.json({
      reviews: stats,
      cards: cardStats,
    });
  } catch (error) {
    console.error('Error fetching study stats:', error);
    res.status(500).json({ error: 'Failed to fetch study statistics' });
  }
});

// POST /api/study/session/start - Start a study session
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const [session] = await db
      .insert(studySessions)
      .values({
        userId,
        startedAt: new Date(),
      })
      .returning();

    res.json(session);
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ error: 'Failed to start study session' });
  }
});

// POST /api/study/session/end - End a study session
router.post('/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId, cardsStudied } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const [session] = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000);

    const [updatedSession] = await db
      .update(studySessions)
      .set({
        endedAt: endTime,
        duration,
        cardsStudied: cardsStudied || 0,
      })
      .where(eq(studySessions.id, sessionId))
      .returning();

    res.json(updatedSession);
  } catch (error) {
    console.error('Error ending study session:', error);
    res.status(500).json({ error: 'Failed to end study session' });
  }
});

export default router;
