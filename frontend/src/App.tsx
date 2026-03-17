import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import GameDetail from './components/GameDetail';
import Cart from './components/Cart';
import CategoryGamesSection from './components/CategoryGamesSection';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Game, CartItem } from './types';
import Footer from './components/Footer';
import NewsletterPopup from './components/NewsletterPopup';
import { ErrorBoundary } from './components/ErrorBoundary';
import CategoryGamesPage from './pages/CategoryGamesPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import HowItWorksPage from './pages/HowItWorksPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import FAQSection from './components/FAQSection';
import FAQPage from './pages/FAQPage';

// Main app content that requires authentication
const AuthenticatedApp = () => {
  const { user, token, logout } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];
      const parsed = JSON.parse(savedCart) as CartItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) =>
          item &&
          item.game &&
          item.game._id &&
          typeof item.quantity === 'number' &&
          item.game.price &&
          typeof (item.game.price as { currentInCAD?: number }).currentInCAD === 'number'
      );
    } catch {
      return [];
    }
  });
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem('cart', JSON.stringify([]));
  };

  const addToCart = (game: Game) => {
    if (!token) {
      toast.error('Please sign in to add items to your cart.');
      window.location.assign('/login');
      return;
    }
    setCartItems((prevItems: CartItem[]) => {
      const existingItem = prevItems.find((item) => item.game._id === game._id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.game._id === game._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { game, quantity: 1 }];
    });
  };

  const removeFromCart = (gameId: string) => {
    setCartItems((prevItems: CartItem[]) =>
      prevItems.filter((item) => item.game._id !== gameId)
    );
  };

  const updateQuantity = (gameId: string, quantity: number) => {
    if (!token) {
      toast.error('Please sign in to update your cart.');
      window.location.assign('/login');
      return;
    }
    if (quantity <= 0) {
      removeFromCart(gameId);
      return;
    }
    setCartItems((prevItems: CartItem[]) =>
      prevItems.map((item) =>
        item.game._id === gameId ? { ...item, quantity } : item
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Navbar 
        user={user} 
        onLogout={logout} 
        cartItemCount={cartItems.reduce((sum, item) => sum + (item?.quantity ?? 0), 0)} 
      />
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <CategoryGamesSection
                  title="PC Games"
                  category="PC Games"
                  viewMorePath="/section/pc-games"
                  onAddToCart={addToCart}
                />
                <CategoryGamesSection
                  title="Global Game Keys"
                  category="Global Game Keys"
                  viewMorePath="/section/global-game-keys"
                  onAddToCart={addToCart}
                />
                <CategoryGamesSection
                  title="Offline Activation"
                  category="Offline Activation"
                  viewMorePath="/section/offline-activation"
                  onAddToCart={addToCart}
                />
                <CategoryGamesSection
                  title="On Sale"
                  category="On Sale !"
                  viewMorePath="/section/on-sale"
                  onAddToCart={addToCart}
                />
                <CategoryGamesSection
                  title="Steam / Epic Region Change"
                  category="Steam / Epic Region Change"
                  viewMorePath="/section/steam-epic-region-change"
                  onAddToCart={addToCart}
                />
                <FAQSection />
              </>
            }
          />
          <Route
            path="/game/:id"
            element={
              <GameDetail onAddToCart={addToCart} />
            }
          />
          <Route path="/section/:section" element={<CategoryGamesPage onAddToCart={addToCart} />} />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/success"
            element={
              <ProtectedRoute>
                <CheckoutSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart
                  cartItems={cartItems}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                  onClear={clearCart}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <NewsletterPopup />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#E5E7EB',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#111827',
            },
          },
          error: {
            style: {
              background: '#7F1D1D',
              color: '#FECACA',
              border: '1px solid #B91C1C',
            },
            iconTheme: {
              primary: '#F87171',
              secondary: '#7F1D1D',
            },
          },
        }}
      />
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;