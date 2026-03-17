import React from 'react';
import { Search, ShoppingCart, User, Gamepad2 } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onHomeClick: () => void;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function Header({ cartCount, onHomeClick, onCartClick, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={onHomeClick}
          >
            <Gamepad2 className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              GameHub
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
              <User className="h-5 w-5" />
              <span className="hidden sm:block">Account</span>
            </button>
            
            <button
              onClick={onCartClick}
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:block">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;