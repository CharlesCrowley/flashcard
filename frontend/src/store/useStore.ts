import { create } from 'zustand';
import type { User, Deck } from '../types';

interface AppState {
  user: User | null;
  currentDeck: Deck | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setCurrentDeck: (deck: Deck | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentDeck: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setCurrentDeck: (deck) => set({ currentDeck: deck }),
}));
