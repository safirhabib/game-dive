import React from 'react';
import { Star, ShoppingCart, Monitor, Gamepad2 } from 'lucide-react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick: () => void;
  onAddToCart: () => void;
}

function GameCard({ game, onClick, onAddToCart }: GameCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart();
  };

  return (
    <div 
      className="group relative bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {game.isFeatured && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              Featured
            </span>
          )}
          {game.originalPrice && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              Sale
            </span>
          )}
        </div>

        {/* Platforms */}
        <div className="absolute top-3 right-3 flex space-x-1">
          {game.platform.includes('PC') && (
            <div className="bg-black/50 backdrop-blur-sm rounded p-1">
              <Monitor className="h-3 w-3 text-white" />
            </div>
          )}
          {(game.platform.includes('PlayStation') || game.platform.includes('Xbox') || game.platform.includes('Nintendo Switch')) && (
            <div className="bg-black/50 backdrop-blur-sm rounded p-1">
              <Gamepad2 className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {game.title}
          </h3>
          <div className="flex items-center space-x-1 text-yellow-400">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{game.rating}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {game.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-purple-400 font-bold text-lg">
              ${game.price}
            </span>
            {game.originalPrice && (
              <span className="text-gray-500 line-through text-sm">
                ${game.originalPrice}
              </span>
            )}
          </div>
          <span className="text-gray-400 text-sm bg-gray-700/50 px-2 py-1 rounded">
            {game.genre}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 group"
        >
          <ShoppingCart className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}

export default GameCard;