export interface Game {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  genre: string;
  platform: string[];
  rating: number;
  description: string;
  features: string[];
  screenshots: string[];
  releaseDate: string;
  developer: string;
  publisher: string;
  isFeatured?: boolean;
  tags: string[];
}

export interface CartItem {
  game: Game;
  quantity: number;
}