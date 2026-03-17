
import { useState, useMemo } from 'react';
import GameCard from './GameCard';
import { Game } from '../types';
import { Filter, Search, Loader2 } from 'lucide-react';

interface GameCatalogProps {
  games: Game[];
  loading: boolean;
  onAddToCart: (game: Game) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

function GameCatalog({ games, loading, onAddToCart, hasMore, onLoadMore }: GameCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const categories = useMemo(() => ['all', 'RPG', 'Action', 'Strategy', 'Racing', 'Adventure', 'Sports'], []);
  const platforms = useMemo(() => ['all', 'PC', 'PS5', 'Xbox Series X', 'Nintendo Switch'], []);
  
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
                            (game.categories && game.categories.includes(selectedCategory)) ||
                            (game.relevantCategories && game.relevantCategories.includes(selectedCategory));
      const matchesPlatform = selectedPlatform === 'all' || 
                            (game.platform && game.platform.toLowerCase().includes(selectedPlatform.toLowerCase()));
      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [games, searchQuery, selectedCategory, selectedPlatform]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <section id="catalog" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Game Collection
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Discover amazing games across all genres. From thrilling adventures to strategic masterpieces.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search games..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6 mb-12">
          {/* Genre Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center space-x-2 text-gray-400">
              <Filter className="h-5 w-5" />
              <span className="text-sm">Filter by:</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-sm">Platform:</span>
            </div>
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedPlatform === platform
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game._id} game={game} onAddToCart={onAddToCart} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-300">No games found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery || selectedCategory !== 'all' || selectedPlatform !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No games available at the moment. Please check back later.'}
            </p>
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load More Games'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default GameCatalog;