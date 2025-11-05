import { pgTable, text, timestamp, integer, real, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  l1: text('l1').notNull().default('es'), // Native language code (ISO 639-1)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Decks table
export const decks = pgTable('decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Cards table
export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  deckId: uuid('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),

  // Main content
  word: text('word').notNull(),
  definition: text('definition').notNull(),
  pronunciation: text('pronunciation'),
  audioUrl: text('audio_url'),

  // Visual learning
  imageUrl: text('image_url'),
  drawingData: text('drawing_data'), // Canvas drawing data (JSON)

  // Context and examples
  exampleSentences: text('example_sentences').array().notNull().default([]),
  translation: text('translation'),

  // Metadata
  partOfSpeech: text('part_of_speech'),
  tags: text('tags').array().notNull().default([]),

  // FSRS scheduling data
  due: timestamp('due').notNull().defaultNow(),
  stability: real('stability').notNull().default(0),
  difficulty: real('difficulty').notNull().default(0),
  elapsedDays: integer('elapsed_days').notNull().default(0),
  scheduledDays: integer('scheduled_days').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  state: integer('state').notNull().default(0), // 0=New, 1=Learning, 2=Review, 3=Relearning
  lastReview: timestamp('last_review'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  deckIdIdx: index('cards_deck_id_idx').on(table.deckId),
  dueIdx: index('cards_due_idx').on(table.due),
}));

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Review data
  rating: integer('rating').notNull(), // FSRS rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  reviewedAt: timestamp('reviewed_at').notNull().defaultNow(),

  // Performance tracking
  timeSpent: integer('time_spent'), // Time in milliseconds
}, (table) => ({
  cardIdIdx: index('reviews_card_id_idx').on(table.cardId),
  userIdIdx: index('reviews_user_id_idx').on(table.userId),
  reviewedAtIdx: index('reviews_reviewed_at_idx').on(table.reviewedAt),
}));

// Study sessions table
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  cardsStudied: integer('cards_studied').notNull().default(0),
  duration: integer('duration'), // Duration in seconds
}, (table) => ({
  userIdIdx: index('study_sessions_user_id_idx').on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  decks: many(decks),
  reviews: many(reviews),
  studySessions: many(studySessions),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  deck: one(decks, {
    fields: [cards.deckId],
    references: [decks.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  card: one(cards, {
    fields: [reviews.cardId],
    references: [cards.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;
