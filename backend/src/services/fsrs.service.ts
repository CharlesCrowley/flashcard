import { FSRS, Rating, State, Card as FSRSCard, RecordLog } from 'fsrs';

/**
 * FSRS Service for spaced repetition scheduling
 * Uses the FSRS algorithm (Free Spaced Repetition Scheduler)
 * 20-30% more efficient than traditional SM-2
 */

export class FSRSService {
  private fsrs: FSRS;

  constructor() {
    // Initialize FSRS with default parameters
    // You can customize these based on your user's learning patterns
    this.fsrs = new FSRS({
      request_retention: 0.9, // Target 90% retention
      maximum_interval: 365,  // Maximum interval of 1 year
      enable_fuzz: true,      // Add randomization to prevent same-day reviews
    });
  }

  /**
   * Create a new card (first time seeing it)
   */
  createNewCard(): FSRSCard {
    return {
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
      last_review: undefined,
    };
  }

  /**
   * Get next review schedule based on rating
   * @param card - Current card state
   * @param rating - User rating (1=Again, 2=Hard, 3=Good, 4=Easy)
   * @returns Updated card states for each rating option
   */
  getNextReview(card: FSRSCard, rating: Rating): RecordLog {
    const now = new Date();
    return this.fsrs.repeat(card, now)[rating];
  }

  /**
   * Get all possible next states for a card
   * Useful for showing user what happens with each rating
   */
  getReviewOptions(card: FSRSCard): {
    again: RecordLog;
    hard: RecordLog;
    good: RecordLog;
    easy: RecordLog;
  } {
    const now = new Date();
    const scheduling = this.fsrs.repeat(card, now);

    return {
      again: scheduling[Rating.Again],
      hard: scheduling[Rating.Hard],
      good: scheduling[Rating.Good],
      easy: scheduling[Rating.Easy],
    };
  }

  /**
   * Convert database card to FSRS card
   */
  toFSRSCard(dbCard: {
    due: Date;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    state: number;
    lastReview: Date | null;
  }): FSRSCard {
    return {
      due: dbCard.due,
      stability: dbCard.stability,
      difficulty: dbCard.difficulty,
      elapsed_days: dbCard.elapsedDays,
      scheduled_days: dbCard.scheduledDays,
      reps: dbCard.reps,
      lapses: dbCard.lapses,
      state: dbCard.state as State,
      last_review: dbCard.lastReview || undefined,
    };
  }

  /**
   * Convert FSRS card to database format
   */
  fromFSRSCard(fsrsCard: FSRSCard): {
    due: Date;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    state: number;
    lastReview: Date | null;
  } {
    return {
      due: fsrsCard.due,
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      elapsedDays: fsrsCard.elapsed_days,
      scheduledDays: fsrsCard.scheduled_days,
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
      state: fsrsCard.state,
      lastReview: fsrsCard.last_review || null,
    };
  }

  /**
   * Get cards due for review (due date <= now)
   */
  isDue(card: FSRSCard): boolean {
    return card.due <= new Date();
  }

  /**
   * Calculate days until next review
   */
  daysUntilDue(card: FSRSCard): number {
    const now = new Date();
    const due = new Date(card.due);
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

export const fsrsService = new FSRSService();
