# ESL Flashcard App

A world-class flashcard application for ESL students featuring spaced repetition, visual learning, and AI-powered content generation.

## Features

- **Spaced Repetition**: FSRS algorithm for optimal learning intervals
- **Visual Learning**: Unsplash image integration + drawing canvas for custom visuals
- **Audio Pronunciation**: Dictionary API integration with audio playback
- **AI-Powered**: Llama 3.3 70b for generating definitions and example sentences
- **Translations**: DeepL API integration for L1 translations
- **Mobile-Friendly**: Swipe gestures and responsive design
- **Progress Tracking**: Comprehensive statistics and learning analytics

## Tech Stack

### Frontend
- Vite + React 18
- TypeScript
- TailwindCSS
- React Query for state management
- Framer Motion for animations

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (or SQLite for development)
- Prisma ORM
- FSRS algorithm (ts-fsrs)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or SQLite for development)
- API Keys (see `.env.example`)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd flashcard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Initialize database
```bash
cd backend
npx prisma migrate dev
cd ..
```

5. Start development servers
```bash
npm run dev
```

Frontend will be available at http://localhost:5173
Backend API will be available at http://localhost:3001

## Project Structure

```
flashcard/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Node.js + Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── utils/         # Utilities
│   └── package.json
└── package.json       # Root workspace config
```

## API Documentation

### Flashcard Endpoints
- `GET /api/cards` - Get all flashcards
- `POST /api/cards` - Create new flashcard
- `GET /api/cards/:id` - Get specific flashcard
- `PUT /api/cards/:id` - Update flashcard
- `DELETE /api/cards/:id` - Delete flashcard

### Study Endpoints
- `GET /api/study/due` - Get cards due for review
- `POST /api/study/review` - Submit review and update schedule

### Content Generation
- `POST /api/generate/definition` - Generate definition with Llama
- `POST /api/generate/examples` - Generate example sentences

### External APIs
- `GET /api/unsplash/search` - Search Unsplash images
- `GET /api/translate` - Translate text with DeepL
- `GET /api/dictionary/:word` - Get dictionary definition

## License

MIT
