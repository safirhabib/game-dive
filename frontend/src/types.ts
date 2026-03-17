export interface CategoryItem {
  name: string;
  href: string;
}

export interface CategorySection {
  name: string;
  items: CategoryItem[];
}

export interface GameCategory {
  name: string;
  featured: CategoryItem[];
  sections: CategorySection[];
}

export interface Game {
  _id: string;
  title: string;
  price: {
    currentInBdt: number;
    originalInBdt: number;
    currentInCAD: number;
    originalInCAD: number;
    discount: number;
    currency: string;
  };
  description: string;
  fullDescription: string;
  systemRequirements: string;
  imageUrl: string;
  categories: string[];
  relevantCategories: string[];
  tags: string[];
  additionalInfo: Record<string, unknown>;
  availability: string;
  isInStock: boolean;
  url: string;
  platform: string;
  scrapedAt: string;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  reviews: Review[];
}

export interface CartItem {
  game: Game;
  quantity: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'publisher';
  avatar: string;
}

export interface Review {
  _id: string;
  title: string;
  text: string;
  rating: number;
  game: string;
  user: User;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
  confirmPassword: string;
}