import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { decksApi, cardsApi } from '../services/api';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';

export default function DeckView() {
  const { deckId } = useParams<{ deckId: string }>();

  const { data: deck, isLoading: deckLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => decksApi.getById(deckId!),
    enabled: !!deckId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['deckStats', deckId],
    queryFn: () => decksApi.getStats(deckId!),
    enabled: !!deckId,
  });

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', deckId],
    queryFn: () => cardsApi.getAll({ deckId }),
    enabled: !!deckId,
  });

  if (deckLoading || statsLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Deck not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{deck.name}</h1>
            {deck.description && (
              <p className="text-gray-600 mt-1">{deck.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Link to={`/study/${deck.id}`} className="btn-primary">
            Start Studying
          </Link>
          <Link
            to={`/cards/new?deckId=${deck.id}`}
            className="btn-secondary"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Card
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Cards</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.new}
            </div>
            <div className="text-sm text-gray-600">New</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-warning mb-1">
              {stats.learning}
            </div>
            <div className="text-sm text-gray-600">Learning</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-success mb-1">
              {stats.review}
            </div>
            <div className="text-sm text-gray-600">Review</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {stats.due}
            </div>
            <div className="text-sm text-gray-600">Due Now</div>
          </div>
        </div>
      )}

      {/* Cards list */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cards</h2>

        {cards && cards.length > 0 ? (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="card flex items-center gap-4 hover:shadow-lg transition-shadow group"
              >
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.word}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {card.word}
                  </h3>
                  <p className="text-gray-600 text-sm truncate mb-2">
                    {card.definition}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {card.partOfSpeech && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                        {card.partOfSpeech}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {card.reps} reviews
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/cards/${card.id}/edit`}
                    className="tap-target p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No cards in this deck yet</p>
            <Link
              to={`/cards/new?deckId=${deck.id}`}
              className="btn-primary inline-block"
            >
              Add your first card
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
