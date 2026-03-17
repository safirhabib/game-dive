import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { API_BASE } from '../config';
import { Game } from '../types';
import ReviewForm from './ReviewForm';
import ReviewsList from './ReviewsList';
import { useAuth } from '../context/AuthContext';
import { proxyImageUrl } from '../utils/imageProxy';

interface GameDetailProps {
  onAddToCart: (game: Game) => void;
}

export const GameDetail = ({ onAddToCart }: GameDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadGame() {
      if (!id) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/games/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.data) {
          throw new Error('Game not found');
        }
        if (!cancelled) {
          setGame(data.data);
          setError(null);
        }
      } catch (_) {
        if (!cancelled) setError('Game not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGame();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!game) return;
    
    setIsAdding(true);
    onAddToCart(game);
    setTimeout(() => setIsAdding(false), 1000);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Games
          </button>
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Game Not Found</h1>
            <p className="text-gray-400">The game you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Games
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-w-1 aspect-h-1 w-full">
            <img
              src={proxyImageUrl(game.imageUrl)}
              alt={game.title}
              className="object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=No+Image';
              }}
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {game.relevantCategories?.map((category, index) => (
                <span
                  key={index}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Description</h2>
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: game.fullDescription }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">System Requirements</h2>
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: game.systemRequirements }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Price</h2>
                <div className="flex flex-wrap items-baseline gap-2">
                  {(game.price?.discount ?? 0) > 0 && (
                    <>
                      <span className="text-gray-400 line-through">
                        ${(game.price?.originalInCAD ?? game.price?.currentInCAD ?? 0).toFixed(2)}
                      </span>
                      <span className="text-2xl font-bold">${game.price?.currentInCAD?.toFixed(2) || '0.00'} CAD</span>
                      <span className="bg-green-600/80 text-white text-sm font-bold px-2 py-0.5 rounded">
                        Save {game.price?.discount ?? 0}%
                      </span>
                    </>
                  )}
                  {!(game.price?.discount ?? 0) > 0 && (
                    <span className="text-2xl font-bold">${game.price?.currentInCAD?.toFixed(2) || '0.00'} CAD</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Average Rating</h2>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl ${
                        star <= game.averageRating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Adding to Cart...
                  </div>
                ) : (
                  'Add to Cart'
                )}
              </button>

              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Delivery within 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Huge discounts compared to retail</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Dedicated support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Refund guarantee if delivery fails</span>
                </div>
              </div>
              <p className="mt-3 text-sm">
                <Link to="/how-it-works" className="text-purple-400 hover:text-purple-300">
                  How does it work?
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">About This Game</h2>
          <div className="bg-gray-800/30 p-6 rounded-lg">
            <div 
              className="prose prose-invert max-w-none"
              style={{
                color: '#e5e7eb',
                lineHeight: '1.6',
                fontSize: '1rem',
              }}
              dangerouslySetInnerHTML={{ 
                __html: game.fullDescription || game.description || 'No description available.'
              }} 
            />
          </div>
        </div>

        <div className="col-span-full mt-8">
          <h2 className="text-3xl font-bold mb-6">Reviews</h2>
          {user ? (
            <ReviewForm game={game} onReviewAdded={() => {
              // Refresh reviews after submission
              window.location.reload();
            }} />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400">
                Please <a href="/login" className="text-blue-400 hover:text-blue-300">login</a> to write a review
              </p>
            </div>
          )}
          <ReviewsList game={game} />
        </div>
      </div>
    </div>
  );
}

export default GameDetail;