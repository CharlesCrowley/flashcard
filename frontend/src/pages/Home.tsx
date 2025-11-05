import { Link } from 'react-router-dom';
import { BookOpen, Brain, TrendingUp, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { studyApi, decksApi } from '../services/api';
import { useStore } from '../store/useStore';

export default function Home() {
  const { user } = useStore();

  const { data: stats } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: () => studyApi.getStats(user!.id),
    enabled: !!user,
  });

  const { data: decks } = useQuery({
    queryKey: ['decks', user?.id],
    queryFn: () => decksApi.getAll(user?.id),
    enabled: !!user,
  });

  const { data: dueCards } = useQuery({
    queryKey: ['dueCards'],
    queryFn: () => studyApi.getDueCards(),
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-600">
          Continue your English learning journey
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {dueCards?.total || 0}
          </div>
          <div className="text-sm text-gray-600">Cards Due</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-success mb-2">
            {stats?.reviews.today.reviews || 0}
          </div>
          <div className="text-sm text-gray-600">Studied Today</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-warning mb-2">
            {decks?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Total Decks</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.cards.review || 0}
          </div>
          <div className="text-sm text-gray-600">In Review</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/study"
          className="card hover:shadow-xl transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Brain className="w-7 h-7 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Start Studying
              </h3>
              <p className="text-sm text-gray-600">
                {dueCards?.total || 0} cards ready to review
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/cards/new"
          className="card hover:shadow-xl transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center group-hover:bg-success/20 transition-colors">
              <Plus className="w-7 h-7 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Create New Card
              </h3>
              <p className="text-sm text-gray-600">
                Add a new word to your collection
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent decks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Your Decks</h2>
          <Link
            to="/decks"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View all
          </Link>
        </div>

        {decks && decks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.slice(0, 6).map((deck) => (
              <Link
                key={deck.id}
                to={`/decks/${deck.id}`}
                className="card hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {deck.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {deck._count?.cards || 0} cards
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You don't have any decks yet</p>
            <Link to="/decks" className="btn-primary inline-block">
              Create your first deck
            </Link>
          </div>
        )}
      </div>

      {/* Study progress */}
      {stats && stats.reviews.total.reviews > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Progress</h2>
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Keep up the great work!
                </h3>
                <p className="text-sm text-gray-600">
                  You've reviewed {stats.reviews.total.reviews} cards so far
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-error">
                  {stats.reviews.ratings.again}
                </div>
                <div className="text-xs text-gray-600">Again</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {stats.reviews.ratings.hard}
                </div>
                <div className="text-xs text-gray-600">Hard</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {stats.reviews.ratings.good}
                </div>
                <div className="text-xs text-gray-600">Good</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {stats.reviews.ratings.easy}
                </div>
                <div className="text-xs text-gray-600">Easy</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
