import { useQuery } from '@tanstack/react-query';
import { studyApi } from '../services/api';
import { useStore } from '../store/useStore';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Stats() {
  const { user } = useStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: () => studyApi.getStats(user!.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">No statistics available</p>
      </div>
    );
  }

  const totalCards = stats.cards.new + stats.cards.learning + stats.cards.review + stats.cards.relearning;
  const masteryPercentage = totalCards > 0
    ? Math.round((stats.cards.review / totalCards) * 100)
    : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Progress</h1>

      {/* Overview cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.reviews.total.reviews}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.reviews.total.cards} unique cards
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.reviews.today.reviews}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {Math.round(stats.reviews.today.timeSpent / 1000 / 60)} minutes
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-warning" />
            </div>
            <div className="text-sm text-gray-600">Due Cards</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.cards.due}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Ready to review
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600">Mastery</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {masteryPercentage}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.cards.review} cards in review
          </div>
        </div>
      </div>

      {/* Card distribution */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Card Distribution</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.cards.new}
            </div>
            <div className="text-sm text-gray-600">New Cards</div>
            <div className="text-xs text-gray-500 mt-1">
              Not studied yet
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning mb-2">
              {stats.cards.learning}
            </div>
            <div className="text-sm text-gray-600">Learning</div>
            <div className="text-xs text-gray-500 mt-1">
              In progress
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success mb-2">
              {stats.cards.review}
            </div>
            <div className="text-sm text-gray-600">Review</div>
            <div className="text-xs text-gray-500 mt-1">
              Learned well
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-error mb-2">
              {stats.cards.relearning}
            </div>
            <div className="text-sm text-gray-600">Relearning</div>
            <div className="text-xs text-gray-500 mt-1">
              Need more practice
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-600"
            style={{ width: `${(stats.cards.new / totalCards) * 100}%` }}
          />
          <div
            className="bg-warning"
            style={{ width: `${(stats.cards.learning / totalCards) * 100}%` }}
          />
          <div
            className="bg-success"
            style={{ width: `${(stats.cards.review / totalCards) * 100}%` }}
          />
          <div
            className="bg-error"
            style={{ width: `${(stats.cards.relearning / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Review Performance</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-error/5 rounded-lg">
            <div className="text-3xl font-bold text-error mb-2">
              {stats.reviews.ratings.again}
            </div>
            <div className="text-sm text-gray-600">Again</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.reviews.total.reviews > 0
                ? Math.round((stats.reviews.ratings.again / stats.reviews.total.reviews) * 100)
                : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-warning/5 rounded-lg">
            <div className="text-3xl font-bold text-warning mb-2">
              {stats.reviews.ratings.hard}
            </div>
            <div className="text-sm text-gray-600">Hard</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.reviews.total.reviews > 0
                ? Math.round((stats.reviews.ratings.hard / stats.reviews.total.reviews) * 100)
                : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-success/5 rounded-lg">
            <div className="text-3xl font-bold text-success mb-2">
              {stats.reviews.ratings.good}
            </div>
            <div className="text-sm text-gray-600">Good</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.reviews.total.reviews > 0
                ? Math.round((stats.reviews.ratings.good / stats.reviews.total.reviews) * 100)
                : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {stats.reviews.ratings.easy}
            </div>
            <div className="text-sm text-gray-600">Easy</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.reviews.total.reviews > 0
                ? Math.round((stats.reviews.ratings.easy / stats.reviews.total.reviews) * 100)
                : 0}%
            </div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Average Rating</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.reviews.averageRating.toFixed(2)} / 4.00
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="card bg-gradient-to-r from-primary-500 to-purple-600 text-white">
        <h3 className="text-xl font-bold mb-2">Keep it up!</h3>
        <p className="text-primary-50">
          You're making great progress. Consistency is key to mastering a new language.
        </p>
        {stats.reviews.today.reviews > 0 && (
          <p className="mt-4 text-sm">
            Today you reviewed {stats.reviews.today.reviews} cards in{' '}
            {Math.round(stats.reviews.today.timeSpent / 1000 / 60)} minutes. Great job!
          </p>
        )}
      </div>
    </div>
  );
}
