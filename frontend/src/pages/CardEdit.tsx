import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tantml:parameter>
import { cardsApi } from '../services/api';
import DrawingCanvas from '../components/DrawingCanvas';

export default function CardEdit() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [drawingData, setDrawingData] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [translation, setTranslation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [tags, setTags] = useState('');

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => cardsApi.getById(cardId!),
    enabled: !!cardId,
  });

  useEffect(() => {
    if (card) {
      setWord(card.word);
      setDefinition(card.definition);
      setPronunciation(card.pronunciation || '');
      setImageUrl(card.imageUrl || '');
      setDrawingData(card.drawingData || '');
      setExamples(card.exampleSentences);
      setTranslation(card.translation || '');
      setPartOfSpeech(card.partOfSpeech || '');
      setTags(card.tags.join(', '));
    }
  }, [card]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => cardsApi.update(cardId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      navigate(-1);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => cardsApi.delete(cardId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      navigate(-1);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      word: word.trim(),
      definition,
      pronunciation,
      imageUrl,
      drawingData,
      exampleSentences: examples.filter(e => e.trim()),
      translation,
      partOfSpeech,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Card not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Card</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Word */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Word *
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            required
          />
        </div>

        {/* Definition */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Definition
          </label>
          <textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Pronunciation & Part of Speech */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pronunciation
            </label>
            <input
              type="text"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Part of Speech
            </label>
            <select
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Select...</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="preposition">Preposition</option>
              <option value="conjunction">Conjunction</option>
              <option value="interjection">Interjection</option>
            </select>
          </div>
        </div>

        {/* Translation */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Translation
          </label>
          <input
            type="text"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Example sentences */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example Sentences
          </label>
          {examples.map((example, index) => (
            <input
              key={index}
              type="text"
              value={example}
              onChange={(e) => {
                const newExamples = [...examples];
                newExamples[index] = e.target.value;
                setExamples(newExamples);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 mb-2"
            />
          ))}
          <button
            type="button"
            onClick={() => setExamples([...examples, ''])}
            className="btn-secondary text-sm"
          >
            + Add Example
          </button>
        </div>

        {/* Image */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Card"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Drawing */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Drawing
          </label>
          <DrawingCanvas
            initialData={drawingData}
            onChange={setDrawingData}
            width={600}
            height={300}
          />
        </div>

        {/* Tags */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary flex-1"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="btn bg-error text-white hover:bg-error/90"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
