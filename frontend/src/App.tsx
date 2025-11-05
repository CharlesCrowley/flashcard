import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Home from './pages/Home';
import Study from './pages/Study';
import Decks from './pages/Decks';
import DeckView from './pages/DeckView';
import CardCreate from './pages/CardCreate';
import CardEdit from './pages/CardEdit';
import Stats from './pages/Stats';
import Navigation from './components/Navigation';

function App() {
  const { initialized } = useStore();

  if (!initialized) {
    // Initialize with demo user
    useStore.setState({
      user: {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        l1: 'ES', // Spanish as default L1
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      initialized: true,
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/decks/:deckId" element={<DeckView />} />
          <Route path="/study" element={<Study />} />
          <Route path="/study/:deckId" element={<Study />} />
          <Route path="/cards/new" element={<CardCreate />} />
          <Route path="/cards/:cardId/edit" element={<CardEdit />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
      <Navigation />
    </div>
  );
}

export default App;
