import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import GameCatalog from './components/GameCatalog';
import GameDetail from './components/GameDetail';
import Cart from './components/Cart';
import { Game, CartItem } from './types';
import Footer from './components/Footer';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'game' | 'cart'>('home');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, [searchQuery, selectedCategory, selectedPlatform]);

  const fetchGames = async () => {
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        category: selectedCategory,
        platform: selectedPlatform
      });
      const response = await fetch(`/api/games?${params}`);
      const data = await response.json();
      setGames(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  const addToCart = (game: Game) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.game.id === game.id);
      if (existing) {
        return prev.map(item =>
          item.game.id === game.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { game, quantity: 1 }];
    });
  };

  const removeFromCart = (gameId: string) => {
    setCartItems(prev => prev.filter(item => item.game.id !== gameId));
  };

  const updateQuantity = (gameId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(gameId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.game.id === gameId ? { ...item, quantity } : item
      )
    );
  };

  const viewGame = async (game: Game) => {
    try {
      const response = await fetch(`http://localhost:5000/api/games/${game.id}`);
      const data = await response.json();
      setSelectedGame(data);
      setCurrentView('game');
    } catch (error) {
      console.error('Error fetching game details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onHomeClick={() => setCurrentView('home')}
        onCartClick={() => setCurrentView('cart')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {currentView === 'home' && (
        <>
          <Hero onViewGames={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} />
          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">Loading games...</p>
            </div>
          ) : (
            <GameCatalog
              games={games}
              onGameClick={viewGame}
              onAddToCart={addToCart}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
            />
          )}
        </>
      )}

      {currentView === 'game' && selectedGame && (
        <GameDetail
          game={selectedGame}
          onBack={() => setCurrentView('home')}
          onAddToCart={addToCart}
        />
      )}

      {currentView === 'cart' && (
        <Cart
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onBack={() => setCurrentView('home')}
        />
      )}
      <Footer />
    </div>
  );
}

export default App;