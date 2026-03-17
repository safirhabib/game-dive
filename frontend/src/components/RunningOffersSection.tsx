import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Tag } from 'lucide-react';
import GameCard from './GameCard';
import { Game } from '../types';

import { API_BASE } from '../config';

export interface RunningOfferItem {
  _id: string;
  order: number;
  title: string;
  slug?: string;
  imageUrl: string;
  productUrl?: string;
  category?: string;
  price: {
    current: number;
    original: number;
    discount: number;
    currency: string;
  };
  game: Game | null;
}

interface RunningOffersSectionProps {
  onAddToCart: (game: Game) => void;
}

function RunningOffersSection({ onAddToCart }: RunningOffersSectionProps) {
  const [items, setItems] = useState<RunningOfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchRunningOffers() {
      try {
        const res = await fetch(`${API_BASE}/games/running-offers?limit=12`);
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.data)) {
          setItems(data.data);
        }
      } catch (_) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRunningOffers();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Running Offers
            </h2>
          </div>
          <Link
            to="/#catalog"
            className="text-purple-400 hover:text-purple-300 font-medium text-sm sm:text-base transition-colors"
          >
            View More…
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items
            .filter((item) => item?.game?._id)
            .map((item) => (
              <GameCard
                key={item._id}
                game={{
                  ...item.game,
                  price: item.game.price ?? {
                    currentInBdt: 0,
                    originalInBdt: 0,
                    currentInCAD: 0,
                    originalInCAD: 0,
                    discount: 0,
                    currency: 'BDT',
                  },
                  relevantCategories: item.game.relevantCategories ?? [],
                }}
                onAddToCart={onAddToCart}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

export default RunningOffersSection;
