import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import GameCard from './GameCard';
import { Game } from '../types';

import { apiFetch } from '../utils/apiFetch';

interface CategoryGamesSectionProps {
  title: string;
  category: string;
  viewMorePath: string;
  onAddToCart: (game: Game) => void;
}

function CategoryGamesSection({ title, category, viewMorePath, onAddToCart }: CategoryGamesSectionProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(
          `/games/category/${encodeURIComponent(category)}?limit=8&page=1`
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setGames(Array.isArray(data.data) ? data.data : []);
        }
      } catch (_) {
        if (!cancelled) setGames([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (loading) {
    return (
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
          <Link to={viewMorePath} className="text-purple-400 hover:text-purple-300 font-medium">
            View More…
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.slice(0, 8).map((game) => (
            <GameCard key={game._id} game={game} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryGamesSection;
