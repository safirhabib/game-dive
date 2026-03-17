import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import GameCard from '../components/GameCard';
import { Game } from '../types';

import { API_BASE } from '../config';

const SECTION_MAP: Record<string, { title: string; category: string }> = {
  'pc-games': { title: 'PC Games', category: 'PC Games' },
  'global-game-keys': { title: 'Global Game Keys', category: 'Global Game Keys' },
  'offline-activation': { title: 'Offline Activation', category: 'Offline Activation' },
  'on-sale': { title: 'On Sale', category: 'On Sale !' },
  'steam-epic-region-change': {
    title: 'Steam / Epic Region Change',
    category: 'Steam / Epic Region Change'
  }
};

interface CategoryGamesPageProps {
  onAddToCart: (game: Game) => void;
}

function CategoryGamesPage({ onAddToCart }: CategoryGamesPageProps) {
  const { section = '' } = useParams();
  const cfg = SECTION_MAP[section];
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(1);
    setGames([]);
  }, [section]);

  useEffect(() => {
    if (!cfg) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/games/category/${encodeURIComponent(cfg.category)}?limit=12&page=${page}`
        );
        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];
        if (!cancelled) {
          setGames((prev) => (page === 1 ? items : [...prev, ...items]));
          setHasMore(Boolean(data.page && data.pages && data.page < data.pages));
        }
      } catch (_) {
        if (!cancelled) {
          setGames((prev) => prev);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cfg, page]);

  if (!cfg) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl text-white font-bold mb-3">Section not found</h1>
          <Link to="/" className="text-purple-400 hover:text-purple-300">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{cfg.title}</h1>
          <Link to="/" className="text-purple-400 hover:text-purple-300">
            Back to home
          </Link>
        </div>

        {loading && games.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard key={game._id} game={game} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default CategoryGamesPage;
