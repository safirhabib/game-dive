
import { ArrowLeft, Star, ShoppingCart, Calendar, User, Building, Tag } from 'lucide-react';
import { Game } from '../types';

interface GameDetailProps {
  game: Game;
  onBack: () => void;
  onAddToCart: (game: Game) => void;
}

function GameDetail({ game, onBack, onAddToCart }: GameDetailProps) {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Games</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {game.screenshots && game.screenshots.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {game.screenshots.slice(1).map((screenshot, index) => (
                  <img
                    key={index}
                    src={screenshot}
                    alt={`${game.title} screenshot ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">{game.title}</h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold">{game.rating}</span>
                  <span className="text-gray-400">/5</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-purple-400 font-semibold">{game.genre}</span>
              </div>

              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {game.description}
              </p>
            </div>

            {/* Game Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-t border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Release Date</p>
                  <p className="text-white font-medium">{new Date(game.releaseDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Developer</p>
                  <p className="text-white font-medium">{game.developer}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Publisher</p>
                  <p className="text-white font-medium">{game.publisher}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Tag className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Platforms</p>
                  <p className="text-white font-medium">{game.platform.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Key Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {game.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Purchase */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-purple-400">
                      ${game.price}
                    </span>
                    {game.originalPrice && (
                      <span className="text-xl text-gray-500 line-through">
                        ${game.originalPrice}
                      </span>
                    )}
                  </div>
                  {game.originalPrice && (
                    <p className="text-green-400 text-sm font-medium">
                      Save ${(game.originalPrice - game.price).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onAddToCart(game)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-3"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameDetail;