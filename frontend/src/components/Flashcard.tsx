import { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Volume2, Image as ImageIcon, Palette } from 'lucide-react';
import { Howl } from 'howler';
import type { Card } from '../types';
import { clsx } from 'clsx';

interface FlashcardProps {
  card: Card;
  onSwipe?: (direction: 'left' | 'right', card: Card) => void;
  showActions?: boolean;
  disabled?: boolean;
}

export default function Flashcard({
  card,
  onSwipe,
  showActions = true,
  disabled = false,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleFlip = () => {
    if (!disabled) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !onSwipe) return;

    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      onSwipe(direction, card);
    }
  };

  const playAudio = () => {
    if (card.audioUrl) {
      const sound = new Howl({
        src: [card.audioUrl],
        html5: true,
      });
      sound.play();
    }
  };

  const hasDrawing = card.drawingData && card.drawingData !== '{}';

  return (
    <motion.div
      ref={cardRef}
      className="flashcard cursor-pointer select-none"
      drag={!disabled && showActions ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className={clsx('flashcard-inner', isFlipped && 'flipped')}
        onClick={handleFlip}
      >
        {/* Front of card */}
        <div className="flashcard-face flashcard-front card">
          <div className="flex flex-col h-full">
            {/* Image */}
            {card.imageUrl && (
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={card.imageUrl}
                  alt={card.word}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Word */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {card.word}
              </h2>

              {/* Pronunciation */}
              {card.pronunciation && (
                <p className="text-lg text-gray-600 mb-4">
                  /{card.pronunciation}/
                </p>
              )}

              {/* Part of speech */}
              {card.partOfSpeech && (
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {card.partOfSpeech}
                </span>
              )}
            </div>

            {/* Audio button */}
            {card.audioUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className="tap-target mx-auto btn-primary rounded-full w-14 h-14"
              >
                <Volume2 className="w-6 h-6 mx-auto" />
              </button>
            )}

            {/* Indicators */}
            <div className="flex gap-2 justify-center mt-4">
              {card.imageUrl && (
                <ImageIcon className="w-5 h-5 text-gray-400" />
              )}
              {hasDrawing && (
                <Palette className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="flashcard-face flashcard-back card">
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Definition */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Definition
              </h3>
              <p className="text-lg text-gray-900">{card.definition}</p>
            </div>

            {/* Translation */}
            {card.translation && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Translation
                </h3>
                <p className="text-lg text-gray-900">{card.translation}</p>
              </div>
            )}

            {/* Example sentences */}
            {card.exampleSentences.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Examples
                </h3>
                <ul className="space-y-2">
                  {card.exampleSentences.map((example, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="text-primary-600">• </span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drawing */}
            {hasDrawing && (
              <div className="mt-auto">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Your Drawing
                </h3>
                <div className="w-full h-32 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            )}

            {/* Tags */}
            {card.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swipe indicators */}
      {showActions && !disabled && (
        <>
          <motion.div
            className="absolute top-8 left-8 text-6xl font-bold text-error opacity-0"
            style={{
              opacity: useTransform(x, [-200, 0], [1, 0]),
            }}
          >
            ✗
          </motion.div>
          <motion.div
            className="absolute top-8 right-8 text-6xl font-bold text-success opacity-0"
            style={{
              opacity: useTransform(x, [0, 200], [0, 1]),
            }}
          >
            ✓
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
