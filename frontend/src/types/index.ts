// Core types for the flashcard app

export interface User {
  id: string;
  email: string;
  name?: string;
  l1: string; // Native language code
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    cards: number;
  };
  cards?: Card[];
}

export interface Card {
  id: string;
  deckId: string;
  deck?: {
    id: string;
    name: string;
  };

  // Content
  word: string;
  definition: string;
  pronunciation?: string;
  audioUrl?: string;
  imageUrl?: string;
  drawingData?: string; // JSON string
  exampleSentences: string[];
  translation?: string;
  partOfSpeech?: string;
  tags: string[];

  // FSRS data
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview?: string;

  createdAt: string;
  updatedAt: string;

  // Optional review options (from API)
  nextReview?: NextReviewOptions;
}

export enum CardState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface NextReviewOptions {
  again: ReviewOption;
  hard: ReviewOption;
  good: ReviewOption;
  easy: ReviewOption;
}

export interface ReviewOption {
  interval: number; // Days until next review
  due: string; // Date when next review is due
}

export interface Review {
  id: string;
  cardId: string;
  userId: string;
  rating: ReviewRating;
  reviewedAt: string;
  timeSpent?: number;
}

export enum ReviewRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export interface StudySession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  cardsStudied: number;
  duration?: number;
}

export interface StudyStats {
  reviews: {
    total: {
      reviews: number;
      cards: number;
    };
    today: {
      reviews: number;
      cards: number;
      timeSpent: number;
    };
    ratings: {
      again: number;
      hard: number;
      good: number;
      easy: number;
    };
    averageRating: number;
  };
  cards: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
    due: number;
  };
}

export interface DictionaryResult {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  definitions: Array<{
    partOfSpeech: string;
    definition: string;
    example?: string;
  }>;
  examples: string[];
  synonyms: string[];
}

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnail: string;
  description: string | null;
  photographer: string;
  photographerUrl: string;
}

export interface TranslationResult {
  original: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
}

export interface GeneratedContent {
  word: string;
  definition: string;
  examples: string[];
}
