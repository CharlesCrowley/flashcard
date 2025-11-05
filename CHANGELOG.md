# Changelog

All notable changes to the ESL Flashcard App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-05

### Added

#### Spaced Repetition System
- **FSRS Algorithm**: Implemented FSRS (Free Spaced Repetition Scheduler) - 20-30% more efficient than traditional SM-2
- **Intelligent Scheduling**: Automatic card scheduling based on difficulty, stability, and user performance
- **4 Rating Options**: Again, Hard, Good, Easy with predicted next review intervals
- **Card States**: New, Learning, Review, Relearning state management
- **Session Tracking**: Study session recording with time tracking and cards studied

#### Visual Learning Features
- **Unsplash Integration**: Search and select high-quality images for vocabulary cards
- **Drawing Canvas**: HTML5 canvas with tools for visual association
  - 6 color options
  - Adjustable line width (1-10px)
  - Eraser tool
  - Clear and download functionality
  - Touch-optimized for mobile devices
- **Image Display**: Card preview with image thumbnails
- **Visual Indicators**: Icons showing which cards have images or drawings

#### Audio & Pronunciation
- **Dictionary Audio**: Automatic pronunciation audio from dictionary APIs
- **One-Tap Playback**: Easy audio playback with visual feedback
- **IPA Phonetics**: International Phonetic Alphabet transcriptions
- **Audio Player**: Howler.js integration for reliable cross-browser audio

#### AI-Powered Content Generation
- **Llama 3.3 70b**: Integration via Groq API for fast inference
- **Definition Generation**: AI-generated learner-friendly definitions
- **Example Sentences**: Contextual example sentence creation (3 per word)
- **Content Simplification**: Simplify complex definitions for ESL learners
- **Batch Processing**: Efficient content generation for multiple cards

#### Translation System
- **DeepL Integration**: Professional-grade translation API
- **30+ Languages**: Support for all major world languages
- **L1 Translation**: Automatic translation to user's native language
- **Batch Translation**: Efficient multi-text translation
- **Usage Monitoring**: API quota tracking

#### Dictionary Integration
- **Primary Dictionary**: Merriam-Webster Learner's Dictionary (ESL-focused)
  - 160,000+ usage examples
  - 22,000+ idioms and collocations
  - Core vocabulary identification
  - 1,000 requests/day free tier
- **Fallback Dictionary**: Free Dictionary API
  - Unlimited requests
  - No API key required
  - Comprehensive definitions
- **Smart Fallback**: Automatic failover between APIs
- **Rich Data**: Definitions, examples, synonyms, part of speech

#### User Interface
- **Mobile-First Design**: Optimized for touch interactions
- **Swipe Gestures**:
  - Left swipe = Don't know (Again)
  - Right swipe = Know (Good)
  - Natural, intuitive interaction
- **Touch Optimization**:
  - 44-48px minimum tap targets (iOS/Android standards)
  - Touch action manipulation to prevent zoom
  - Overscroll behavior control
- **Responsive Layout**: Works on all screen sizes
- **Bottom Navigation**: Fixed bottom nav with active state indicators
- **Card Flip Animation**: 3D flip effect with backface-hidden
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages

#### Pages & Components
- **Home Dashboard**: Quick stats, due cards, recent decks, progress overview
- **Study Mode**:
  - FSRS-powered review sessions
  - Progress bar
  - Session summary
  - Card statistics
- **Deck Management**:
  - Create, edit, delete decks
  - Deck statistics
  - Card counts
- **Card Creation**:
  - Multi-step form
  - Dictionary lookup
  - AI generation
  - Image search
  - Drawing canvas
  - Translation
- **Statistics Dashboard**:
  - Review performance
  - Card distribution
  - Rating breakdown
  - Time tracking
  - Mastery percentage

#### Backend API
- **RESTful Design**: Standard HTTP methods and status codes
- **Endpoints**:
  - `/api/decks` - Deck CRUD operations
  - `/api/cards` - Card CRUD with search/filter
  - `/api/study` - Review submission, due cards, stats
  - `/api/dictionary` - Word lookup
  - `/api/generate` - AI content generation
  - `/api/unsplash` - Image search
  - `/api/translate` - Translation
- **Security**:
  - Helmet.js for HTTP headers
  - CORS configuration
  - Rate limiting (100 req/15min)
- **Validation**: Zod schemas for all inputs
- **Error Handling**: Centralized error middleware

#### Database
- **Prisma ORM**: Type-safe database access
- **PostgreSQL Support**: Production-ready relational database
- **SQLite Support**: Development-friendly option
- **Schema**:
  - Users with L1 preference
  - Decks with card counts
  - Cards with full FSRS fields
  - Reviews for historical data
  - Study sessions for analytics
- **Migrations**: Version-controlled schema changes

#### Developer Experience
- **TypeScript**: Full type safety across frontend and backend
- **Monorepo**: Workspace setup with npm workspaces
- **Code Organization**: Clear separation of concerns
- **API Client**: Typed Axios client with all endpoints
- **State Management**: Zustand for global state, React Query for server state
- **Hot Reload**: Vite HMR for instant feedback
- **Type Checking**: Strict TypeScript configuration

#### Testing & Quality
- **Linting**: ESLint configuration for code quality
- **Type Safety**: Strict TypeScript mode
- **Error Boundaries**: React error boundaries
- **Input Validation**: Zod schemas on backend
- **Rate Limiting**: Prevent API abuse

#### Documentation
- **README**: Comprehensive setup and usage guide
- **API Documentation**: Endpoint descriptions and examples
- **Environment Template**: `.env.example` with all required keys
- **Code Comments**: Inline documentation for complex logic
- **Type Definitions**: Self-documenting TypeScript types

### Technical Details

#### Dependencies

**Backend:**
- express: ^4.18.2 - Web framework
- @prisma/client: ^5.8.1 - Database ORM
- fsrs: ^3.4.0 - Spaced repetition algorithm
- groq-sdk: ^0.3.2 - Llama API client
- zod: ^3.22.4 - Schema validation
- cors: ^2.8.5 - CORS middleware
- helmet: ^7.1.0 - Security headers
- dotenv: ^16.3.1 - Environment variables

**Frontend:**
- react: ^18.2.0 - UI library
- react-router-dom: ^6.21.1 - Routing
- @tanstack/react-query: ^5.17.9 - Server state management
- zustand: ^4.4.7 - Global state management
- framer-motion: ^10.18.0 - Animations
- axios: ^1.6.5 - HTTP client
- tailwindcss: ^3.4.1 - Utility-first CSS
- lucide-react: ^0.309.0 - Icon library
- howler: ^2.2.4 - Audio playback
- date-fns: ^3.0.6 - Date utilities

#### Architecture Decisions

1. **FSRS over SM-2**: Chose FSRS for 20-30% improvement in review efficiency
2. **Monorepo Structure**: Easier development with shared types and configuration
3. **PostgreSQL**: Scalable, reliable, ACID-compliant for production
4. **React Query**: Reduces boilerplate, automatic caching, optimistic updates
5. **Tailwind CSS**: Rapid development, consistent design, small bundle size
6. **Framer Motion**: Smooth animations with gesture support
7. **TypeScript**: Type safety prevents runtime errors
8. **Mobile-First**: Most users learn on mobile devices

#### Research-Based Features

- **Active Recall**: Proven to enhance memory retention
- **Spaced Repetition**: Optimal timing for long-term memory
- **Visual Learning**: 65% better retention than text alone
- **Contextual Learning**: Example sentences improve understanding
- **Multimodal**: Combining visual, audio, and text
- **Minimal Interface**: Reduces cognitive load during study
- **Mobile Gestures**: Natural, intuitive interactions

### Performance

- **Frontend Bundle**: Optimized with Vite code splitting
- **API Response**: < 100ms for most endpoints (without external APIs)
- **Database Queries**: Indexed for common queries
- **Image Loading**: Lazy loading and thumbnails
- **Caching**: React Query cache with 5-minute stale time

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility

- Touch targets meet WCAG guidelines (44-48px)
- Keyboard navigation support
- Semantic HTML
- Color contrast ratios
- Screen reader compatible

## Future Enhancements

### Planned Features
- [ ] User authentication and accounts
- [ ] Cloud sync across devices
- [ ] Shared decks (community)
- [ ] Voice recording for pronunciation practice
- [ ] Gamification (streaks, achievements, levels)
- [ ] PDF/CSV import for bulk card creation
- [ ] Offline mode (PWA)
- [ ] Dark mode
- [ ] Multiple languages for UI
- [ ] Advanced statistics (retention curves, forecast)
- [ ] Deck templates for common topics
- [ ] Collaborative decks
- [ ] Spaced repetition algorithm customization

### Known Limitations
- No offline support yet (requires PWA)
- Single user mode (no multi-user authentication)
- Dictionary API rate limits (1000/day for MW)
- No image upload (Unsplash only)
- No video support
- No audio recording

### Migration Guide
N/A - Initial release

## [Unreleased]

Nothing yet!

---

## Release Notes Format

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks
