
import GameCard from './GameCard';
import { Game } from '../types';
import { Filter } from 'lucide-react';

interface GameCatalogProps {
  games: Game[];
  onGameClick: (game: Game) => void;
  onAddToCart: (game: Game) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
}

function GameCatalog({ 
  games, 
  onGameClick, 
  onAddToCart, 
  selectedCategory, 
  onCategoryChange,
  selectedPlatform,
  onPlatformChange 
}: GameCatalogProps) {
  const categories = ['all', 'RPG', 'Action', 'Strategy', 'Racing', 'Adventure', 'Sports'];
  const platforms = ['all', 'PC', 'PS5', 'Xbox Series X', 'Nintendo Switch'];

  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.genre === selectedCategory;
    const matchesPlatform = selectedPlatform === 'all' || game.platform.includes(selectedPlatform);
    return matchesCategory && matchesPlatform;
  });

  return (
    <section id="catalog" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Game Collection
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover amazing games across all genres. From thrilling adventures to strategic masterpieces.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-6 mb-12">
          {/* Genre Filter */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by genre:</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {category === 'all' ? 'All Games' : category}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by platform:</span>
            </div>
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => onPlatformChange(platform)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPlatform === platform
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {platform === 'all' ? 'All Platforms' : platform}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => onGameClick(game)}
                onAddToCart={() => onAddToCart(game)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No games found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default GameCatalog;