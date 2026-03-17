import { ShoppingCart, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onAddToCart: (game: Game) => void;
  onClick?: () => void;
}

function GameCard({ game, onAddToCart, onClick }: GameCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(game);
  };

  // Get first 20 words of fullDescription for preview
  const previewDescription = game.fullDescription
    ? game.fullDescription.replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .split(' ')
        .slice(0, 20)
        .join(' ') + '...'
    : 'No description available';

  return (
    <Link 
      to={`/game/${game._id}`}
      className="group relative bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer block h-full flex flex-col"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden flex-shrink-0">
        <img
          src={game.imageUrl}
          alt={game.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        
        {/* Stock Status */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${game.isInStock !== false ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {game.isInStock !== false ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Platform */}
        <div className="absolute top-3 right-3">
          <div className="bg-black/50 backdrop-blur-sm rounded p-1">
            <Monitor className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={game.isInStock === false}
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>

      {/* Game Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-white mb-2 line-clamp-2 h-12">{game.title}</h3>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(game.relevantCategories ?? []).slice(0, 2).map((category, index) => (
            <span key={index} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
              {category}
            </span>
          ))}
        </div>

        {/* Description Preview */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">
          {previewDescription}
        </p>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-bold text-lg">
                ${(game.price?.currentInCAD ?? 0).toFixed(2)} CAD
              </span>
              {(game.price?.discount ?? 0) > 0 && (
                <span className="text-gray-400 text-sm line-through ml-2">
                  ${(game.price?.originalInCAD ?? game.price?.currentInCAD ?? 0).toFixed(2)}
                </span>
              )}
            </div>
            {(game.price?.discount ?? 0) > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                -{game.price.discount}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default GameCard;