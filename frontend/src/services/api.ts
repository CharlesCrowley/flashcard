import axios from 'axios';
import type {
  Card,
  Deck,
  Review,
  StudyStats,
  DictionaryResult,
  UnsplashImage,
  TranslationResult,
  GeneratedContent,
  ReviewRating,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Decks
export const decksApi = {
  getAll: (userId?: string) =>
    api.get<Deck[]>('/decks', { params: { userId } }).then(res => res.data),

  getById: (id: string) =>
    api.get<Deck>(`/decks/${id}`).then(res => res.data),

  create: (data: { name: string; description?: string; userId: string }) =>
    api.post<Deck>('/decks', data).then(res => res.data),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<Deck>(`/decks/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/decks/${id}`).then(res => res.data),

  getStats: (id: string) =>
    api.get<{
      total: number;
      new: number;
      learning: number;
      review: number;
      due: number;
      mastery: number;
    }>(`/decks/${id}/stats`).then(res => res.data),
};

// Cards
export const cardsApi = {
  getAll: (params?: { deckId?: string; tag?: string; search?: string }) =>
    api.get<Card[]>('/cards', { params }).then(res => res.data),

  getById: (id: string) =>
    api.get<Card>(`/cards/${id}`).then(res => res.data),

  create: (data: Partial<Card>) =>
    api.post<Card>('/cards', data).then(res => res.data),

  update: (id: string, data: Partial<Card>) =>
    api.put<Card>(`/cards/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/cards/${id}`).then(res => res.data),

  getStats: (id: string) =>
    api.get(`/cards/${id}/stats`).then(res => res.data),
};

// Study
export const studyApi = {
  getDueCards: (deckId?: string, limit?: number) =>
    api.get<{ cards: Card[]; total: number }>('/study/due', {
      params: { deckId, limit },
    }).then(res => res.data),

  submitReview: (data: {
    cardId: string;
    userId: string;
    rating: ReviewRating;
    timeSpent?: number;
  }) =>
    api.post<{
      card: Card;
      review: Review;
      nextDue: string;
      interval: number;
    }>('/study/review', data).then(res => res.data),

  getStats: (userId: string, deckId?: string) =>
    api.get<StudyStats>('/study/stats', {
      params: { userId, deckId },
    }).then(res => res.data),

  startSession: (userId: string) =>
    api.post('/study/session/start', { userId }).then(res => res.data),

  endSession: (sessionId: string, cardsStudied: number) =>
    api.post('/study/session/end', { sessionId, cardsStudied }).then(res => res.data),
};

// Dictionary
export const dictionaryApi = {
  lookup: (word: string) =>
    api.get<DictionaryResult>(`/dictionary/${encodeURIComponent(word)}`).then(res => res.data),
};

// Content Generation (LLM)
export const generateApi = {
  definition: (word: string, context?: string) =>
    api.post<{ word: string; definition: string }>('/generate/definition', {
      word,
      context,
    }).then(res => res.data),

  examples: (word: string, count?: number) =>
    api.post<{ word: string; examples: string[] }>('/generate/examples', {
      word,
      count,
    }).then(res => res.data),

  content: (word: string) =>
    api.post<GeneratedContent>('/generate/content', { word }).then(res => res.data),

  simplify: (definition: string) =>
    api.post<{ original: string; simplified: string }>('/generate/simplify', {
      definition,
    }).then(res => res.data),
};

// Unsplash
export const unsplashApi = {
  search: (query: string, count?: number) =>
    api.get<{ query: string; images: UnsplashImage[] }>('/unsplash/search', {
      params: { query, count },
    }).then(res => res.data),

  getImage: (id: string) =>
    api.get<UnsplashImage>(`/unsplash/image/${id}`).then(res => res.data),

  trackDownload: (imageId: string) =>
    api.post('/unsplash/track-download', { imageId }).then(res => res.data),
};

// Translation
export const translateApi = {
  translate: (text: string, targetLang: string, sourceLang = 'EN') =>
    api.post<TranslationResult>('/translate', {
      text,
      targetLang,
      sourceLang,
    }).then(res => res.data),

  translateBatch: (texts: string[], targetLang: string, sourceLang = 'EN') =>
    api.post<{
      translations: Array<{ original: string; translation: string }>;
      sourceLang: string;
      targetLang: string;
    }>('/translate/batch', {
      texts,
      targetLang,
      sourceLang,
    }).then(res => res.data),

  getLanguages: () =>
    api.get<Array<{ code: string; name: string }>>('/translate/languages').then(res => res.data),

  getUsage: () =>
    api.get<{ count: number; limit: number }>('/translate/usage').then(res => res.data),
};

export default api;
