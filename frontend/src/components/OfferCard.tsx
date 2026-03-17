import { ExternalLink, Tag } from 'lucide-react';

export interface OfferItem {
  _id: string;
  title: string;
  imageUrl: string;
  productUrl?: string;
  category?: string;
  price: {
    current: number;
    original: number;
    discount: number;
    currency: string;
  };
}

interface OfferCardProps {
  offer: OfferItem;
}

function OfferCard({ offer }: OfferCardProps) {
  const { title, imageUrl, productUrl, category, price } = offer;
  const content = (
    <div className="group relative bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer block h-full flex flex-col">
      <div className="relative overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Sale
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        {category && (
          <div className="flex items-center gap-1 mb-2">
            <Tag className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">{category}</span>
          </div>
        )}
        <h3 className="font-bold text-white mb-3 line-clamp-2 h-12">{title}</h3>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg">
              ${price.current.toLocaleString()}
            </span>
            {price.original > 0 && price.original > price.current && (
              <span className="text-gray-400 text-sm line-through ml-2">
                ${price.original.toLocaleString()}
              </span>
            )}
          </div>
          {price.discount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              -{price.discount}%
            </span>
          )}
        </div>
        {productUrl && (
          <span className="inline-flex items-center gap-1 text-purple-400 text-sm mt-2 group-hover:underline">
            View on store <ExternalLink className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );

  if (productUrl) {
    return (
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {content}
      </a>
    );
  }
  return content;
}

export default OfferCard;
