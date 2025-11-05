import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyApi } from '../services/api';
import { useStore } from '../store/useStore';
import { ReviewRating, type Card } from '../types';
import Flashcard from '../components/Flashcard';
import { CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

export default function Study() {
  const { deckId } = useParams();
  const { user } = useStore();
  const queryClient = useQueryClient();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cardsStudied, setCardsStudied] = useState(0);
  const [startTime] = useState(Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ['dueCards', deckId],
    queryFn: () => studyApi.getDueCards(deckId, 20),
  });

  const reviewMutation = useMutation({
    mutationFn: (params: { cardId: string; rating: ReviewRating; timeSpent: number }) =>
      studyApi.submitReview({
        ...params,
        userId: user!.id,
      }),
    onSuccess: () => {
      setCardsStudied((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['dueCards'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Start session
  useEffect(() => {
    if (user && !sessionId) {
      studyApi.startSession(user.id).then((session) => {
        setSessionId(session.id);
      });
    }
  }, [user, sessionId]);

  // End session on unmount
  useEffect(() => {
    return () => {
      if (sessionId && cardsStudied > 0) {
        studyApi.endSession(sessionId, cardsStudied);
      }
    };
  }, [sessionId, cardsStudied]);

  const handleSwipe = (direction: 'left' | 'right', card: Card) => {
    const cardStartTime = Date.now();
    const timeSpent = cardStartTime - startTime;

    const rating = direction === 'right' ? ReviewRating.Good : ReviewRating.Again;

    reviewMutation.mutate({
      cardId: card.id,
      rating,
      timeSpent,
    });

    // Move to next card
    setTimeout(() => {
      setCurrentCardIndex((prev) => prev + 1);
    }, 300);
  };

  const handleRating = (rating: ReviewRating) => {
    if (!currentCard) return;

    const timeSpent = Date.now() - startTime;

    reviewMutation.mutate({
      cardId: currentCard.id,
      rating,
      timeSpent,
    });

    setTimeout(() => {
      setCurrentCardIndex((prev) => prev + 1);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const cards = data?.cards || [];
  const currentCard = cards[currentCardIndex];

  if (!currentCard) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          All done for now!
        </h2>
        <p className="text-gray-600 mb-6">
          You've reviewed all due cards. Great job!
        </p>
        {cardsStudied > 0 && (
          <div className="card max-w-md mx-auto mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600">
                  {cardsStudied}
                </div>
                <div className="text-sm text-gray-600">Cards Studied</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-success">
                  {Math.round((Date.now() - startTime) / 1000 / 60)}
                </div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
            </div>
          </div>
        )}
        <a href="/" className="btn-primary">
          Back to Home
        </a>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Card {currentCardIndex + 1} of {cards.length}
          </span>
          <span className="text-sm text-gray-500">
            {cardsStudied} reviewed
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <Flashcard
          key={currentCard.id}
          card={currentCard}
          onSwipe={handleSwipe}
        />
      </div>

      {/* Swipe hint */}
      <div className="text-center mb-6 text-sm text-gray-500">
        <p>Swipe left if you don't know, right if you know</p>
        <p className="mt-1">Or tap the buttons below</p>
      </div>

      {/* Rating buttons */}
      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
        <button
          onClick={() => handleRating(ReviewRating.Again)}
          className="tap-target flex flex-col items-center gap-2 p-4 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors active:scale-95"
        >
          <XCircle className="w-6 h-6" />
          <span className="text-sm font-medium">Again</span>
          {currentCard.nextReview && (
            <span className="text-xs">&lt; 10m</span>
          )}
        </button>

        <button
          onClick={() => handleRating(ReviewRating.Hard)}
          className="tap-target flex flex-col items-center gap-2 p-4 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors active:scale-95"
        >
          <AlertCircle className="w-6 h-6" />
          <span className="text-sm font-medium">Hard</span>
          {currentCard.nextReview && (
            <span className="text-xs">
              {currentCard.nextReview.hard.interval}d
            </span>
          )}
        </button>

        <button
          onClick={() => handleRating(ReviewRating.Good)}
          className="tap-target flex flex-col items-center gap-2 p-4 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors active:scale-95"
        >
          <CheckCircle className="w-6 h-6" />
          <span className="text-sm font-medium">Good</span>
          {currentCard.nextReview && (
            <span className="text-xs">
              {currentCard.nextReview.good.interval}d
            </span>
          )}
        </button>

        <button
          onClick={() => handleRating(ReviewRating.Easy)}
          className="tap-target flex flex-col items-center gap-2 p-4 bg-primary-600/10 text-primary-600 rounded-lg hover:bg-primary-600/20 transition-colors active:scale-95"
        >
          <Zap className="w-6 h-6" />
          <span className="text-sm font-medium">Easy</span>
          {currentCard.nextReview && (
            <span className="text-xs">
              {currentCard.nextReview.easy.interval}d
            </span>
          )}
        </button>
      </div>

      {/* Card info */}
      <div className="max-w-2xl mx-auto mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-500">Reviews</div>
            <div className="font-semibold text-gray-900">{currentCard.reps}</div>
          </div>
          <div>
            <div className="text-gray-500">Lapses</div>
            <div className="font-semibold text-gray-900">{currentCard.lapses}</div>
          </div>
          <div>
            <div className="text-gray-500">Difficulty</div>
            <div className="font-semibold text-gray-900">
              {Math.round(currentCard.difficulty * 10) / 10}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
