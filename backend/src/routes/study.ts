import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { fsrsService } from '../services/fsrs.service';
import { Rating } from 'fsrs';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

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

    const where: any = {
      due: {
        lte: new Date(),
      },
    };

    if (deckId) {
      where.deckId = deckId as string;
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
      orderBy: [
        { due: 'asc' }, // Cards most overdue first
        { state: 'asc' }, // New cards before review cards
      ],
      take: parseInt(limit as string),
    });

    // For each card, calculate next review options
    const cardsWithOptions = cards.map(card => {
      const fsrsCard = fsrsService.toFSRSCard(card);
      const options = fsrsService.getReviewOptions(fsrsCard);

      return {
        ...card,
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
      total: cards.length,
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
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Calculate next review using FSRS
    const fsrsCard = fsrsService.toFSRSCard(card);
    const nextReview = fsrsService.getNextReview(fsrsCard, rating as Rating);
    const updatedFsrsData = fsrsService.fromFSRSCard(nextReview.card);

    // Update card in database
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updatedFsrsData,
    });

    // Create review record
    const review = await prisma.review.create({
      data: {
        cardId,
        userId,
        rating,
        timeSpent,
        reviewedAt: new Date(),
      },
    });

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

    const where: any = { userId: userId as string };
    if (deckId) where.card = { deckId: deckId as string };

    // Get review statistics
    const reviews = await prisma.review.findMany({
      where,
      include: {
        card: {
          select: {
            deckId: true,
            word: true,
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReviews = reviews.filter(r => r.reviewedAt >= today);

    // Calculate statistics
    const stats = {
      total: {
        reviews: reviews.length,
        cards: new Set(reviews.map(r => r.cardId)).size,
      },
      today: {
        reviews: todayReviews.length,
        cards: new Set(todayReviews.map(r => r.cardId)).size,
        timeSpent: todayReviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      },
      ratings: {
        again: reviews.filter(r => r.rating === 1).length,
        hard: reviews.filter(r => r.rating === 2).length,
        good: reviews.filter(r => r.rating === 3).length,
        easy: reviews.filter(r => r.rating === 4).length,
      },
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    };

    // Get cards by state
    const cardWhere: any = {};
    if (deckId) cardWhere.deckId = deckId as string;

    const allCards = await prisma.card.findMany({
      where: cardWhere,
      select: { state: true, due: true },
    });

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

    const session = await prisma.studySession.create({
      data: {
        userId,
        startedAt: new Date(),
      },
    });

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

    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000);

    const updatedSession = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endedAt: endTime,
        duration,
        cardsStudied: cardsStudied || 0,
      },
    });

    res.json(updatedSession);
  } catch (error) {
    console.error('Error ending study session:', error);
    res.status(500).json({ error: 'Failed to end study session' });
  }
});

export default router;
