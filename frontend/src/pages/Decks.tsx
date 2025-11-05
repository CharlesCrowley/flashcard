import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decksApi } from '../services/api';
import { useStore } from '../store/useStore';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

export default function Decks() {
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: decks, isLoading } = useQuery({
    queryKey: ['decks', user?.id],
    queryFn: () => decksApi.getAll(user?.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      decksApi.create({ name, userId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      setNewDeckName('');
      setShowCreateForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => decksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckName.trim()) {
      createMutation.mutate(newDeckName.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Decks</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          New Deck
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="card mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Create New Deck</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Deck name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newDeckName.trim() || createMutation.isPending}
              className="btn-primary"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewDeckName('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Decks grid */}
      {decks && decks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div key={deck.id} className="card group hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/decks/${deck.id}`}
                    className="font-semibold text-gray-900 hover:text-primary-600 truncate block"
                  >
                    {deck.name}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {deck._count?.cards || 0} cards
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${deck.name}"?`)) {
                      deleteMutation.mutate(deck.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:bg-error/10 p-2 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {deck.description && (
                <p className="text-sm text-gray-600 mb-4">{deck.description}</p>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/study/${deck.id}`}
                  className="btn-primary flex-1 text-center text-sm"
                >
                  Study
                </Link>
                <Link
                  to={`/decks/${deck.id}`}
                  className="btn-secondary flex-1 text-center text-sm"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No decks yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first deck to start learning
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Deck
          </button>
        </div>
      )}
    </div>
  );
}
