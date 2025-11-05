import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi, decksApi, dictionaryApi, generateApi, unsplashApi, translateApi } from '../services/api';
import { useStore } from '../store/useStore';
import DrawingCanvas from '../components/DrawingCanvas';
import { Search, Sparkles, Languages, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function CardCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useStore();

  const [deckId, setDeckId] = useState(searchParams.get('deckId') || '');
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [drawingData, setDrawingData] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [translation, setTranslation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [tags, setTags] = useState('');

  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');

  const { data: decks } = useQuery({
    queryKey: ['decks', user?.id],
    queryFn: () => decksApi.getAll(user?.id),
    enabled: !!user,
  });

  const dictionaryMutation = useMutation({
    mutationFn: (word: string) => dictionaryApi.lookup(word),
    onSuccess: (data) => {
      if (data.definitions.length > 0) {
        setDefinition(data.definitions[0].definition);
        setPartOfSpeech(data.definitions[0].partOfSpeech);
      }
      if (data.phonetic) setPronunciation(data.phonetic);
      if (data.audioUrl) setAudioUrl(data.audioUrl);
      if (data.examples.length > 0) setExamples(data.examples.slice(0, 3));
    },
  });

  const generateMutation = useMutation({
    mutationFn: (word: string) => generateApi.content(word),
    onSuccess: (data) => {
      setDefinition(data.definition);
      setExamples(data.examples);
    },
  });

  const translateMutation = useMutation({
    mutationFn: (text: string) => translateApi.translate(text, user?.l1 || 'ES'),
    onSuccess: (data) => {
      setTranslation(data.translation);
    },
  });

  const imageSearchMutation = useMutation({
    mutationFn: (query: string) => unsplashApi.search(query, 12),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => cardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      navigate(`/decks/${deckId}`);
    },
  });

  const handleLookup = () => {
    if (word.trim()) {
      dictionaryMutation.mutate(word.trim());
      translateMutation.mutate(word.trim());
    }
  };

  const handleGenerate = () => {
    if (word.trim()) {
      generateMutation.mutate(word.trim());
    }
  };

  const handleImageSearch = () => {
    if (imageSearchQuery.trim()) {
      imageSearchMutation.mutate(imageSearchQuery.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deckId || !word.trim()) {
      alert('Please select a deck and enter a word');
      return;
    }

    createMutation.mutate({
      deckId,
      word: word.trim(),
      definition,
      pronunciation,
      audioUrl,
      imageUrl,
      drawingData,
      exampleSentences: examples.filter(e => e.trim()),
      translation,
      partOfSpeech,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Card</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck selection */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deck *
          </label>
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            required
          >
            <option value="">Select a deck...</option>
            {decks?.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>

        {/* Word */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Word *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Enter a word..."
              required
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={!word.trim() || dictionaryMutation.isPending}
              className="btn-secondary"
            >
              <Search className="w-5 h-5 inline mr-2" />
              Look up
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!word.trim() || generateMutation.isPending}
              className="btn-primary"
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              AI Generate
            </button>
          </div>
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
            placeholder="Definition of the word..."
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
              placeholder="/prəˌnʌnsiˈeɪʃən/"
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
            Translation ({user?.l1 || 'L1'})
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Translation..."
            />
            {translateMutation.isPending && (
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            )}
          </div>
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
              placeholder={`Example ${index + 1}...`}
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
            Image
          </label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Selected"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Image URL..."
            />
            <button
              type="button"
              onClick={() => {
                setShowImageSearch(!showImageSearch);
                if (!showImageSearch && word) {
                  setImageSearchQuery(word);
                  imageSearchMutation.mutate(word);
                }
              }}
              className="btn-secondary"
            >
              <ImageIcon className="w-5 h-5 inline mr-2" />
              Search
            </button>
          </div>

          {showImageSearch && (
            <div className="mt-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleImageSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Search images..."
                />
                <button
                  type="button"
                  onClick={handleImageSearch}
                  className="btn-primary"
                >
                  Search
                </button>
              </div>

              {imageSearchMutation.data && (
                <div className="grid grid-cols-3 gap-2">
                  {imageSearchMutation.data.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setImageUrl(img.url);
                        setShowImageSearch(false);
                        unsplashApi.trackDownload(img.id);
                      }}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-600"
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.description || ''}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawing */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Drawing (Visual Association)
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
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary flex-1"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Card'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
