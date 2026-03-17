import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';

import { GameCategory, CategoryItem } from '../types';

interface NavbarProps {
  cartItemCount: number;
  user: any;
  onLogout: () => void;
}

const Navbar = ({ cartItemCount, user, onLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsUserMenuOpen(false);
  };

  const [categories] = useState<GameCategory[]>([
    {
      name: 'New & Featured',
      featured: [
        { name: 'New Releases', href: '/new-releases' },
        { name: 'Best Sellers', href: '/best-sellers' },
        { name: 'Member Exclusive', href: '/member-exclusive' },
      ],
      sections: [
        {
          name: 'Shop by Category',
          items: [
            { name: 'Action', href: '/category/action' },
            { name: 'Adventure', href: '/category/adventure' },
            { name: 'RPG', href: '/category/rpg' },
            { name: 'Strategy', href: '/category/strategy' },
          ],
        },
        {
          name: 'Platform',
          items: [
            { name: 'PC', href: '/platform/pc' },
            { name: 'PlayStation', href: '/platform/playstation' },
            { name: 'Xbox', href: '/platform/xbox' },
            { name: 'Nintendo', href: '/platform/nintendo' },
          ],
        },
      ],
    },
    // Add more main categories as needed
  ]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => document.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
      scrolled ? 'shadow-md' : ''
    }`}>
      {/* Top Bar */}
      <div className="bg-gray-100 text-xs text-gray-600 py-1">
        <div className="container mx-auto px-4 flex justify-end space-x-6">
          <a href="#" className="hover:text-black">Help</a>
          {user ? (
            <button onClick={onLogout} className="hover:text-black">
              Sign Out
            </button>
          ) : (
            <>
              <a href="#" className="hover:text-black">Join Us</a>
              <Link to="/login" className="hover:text-black">Sign In</Link>
            </>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold">GAME DIVE</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 relative z-20">
            {categories.map((category) => (
              <div key={category.name} className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
                  className={`font-medium py-6 px-1 border-b-2 transition-colors duration-200 ${
                    activeCategory === category.name 
                      ? 'text-purple-600 border-purple-600' 
                      : 'text-gray-700 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }`}
                >
                  {category.name}
                </button>

                {/* Dropdown Menu */}
                {activeCategory === category.name && (
                  <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[calc(100vw-2rem)] xl:max-w-6xl bg-white shadow-lg z-10 rounded-b-lg overflow-hidden border border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Featured Links */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Featured</h3>
                        <ul className="space-y-3">
                          {category.featured.map((item: CategoryItem) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className="text-sm text-gray-600 hover:text-purple-600 transition-colors flex items-center"
                                onClick={() => setActiveCategory(null)}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Category Sections */}
                      {category.sections.map((section: { name: string; items: CategoryItem[] }) => (
                        <div key={section.name} className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{section.name}</h3>
                          <ul className="space-y-3">
                            {section.items.map((item: CategoryItem) => (
                              <li key={item.name}>
                                <Link
                                  to={item.href}
                                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors flex items-center"
                                  onClick={() => setActiveCategory(null)}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover:bg-purple-500"></span>
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    
                    {/* Decorative bottom border */}
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search and Icons */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="bg-gray-100 rounded-full py-1 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <Heart className="h-6 w-6" />
              </button>
              <Link
                to="/cart"
                className="p-2 text-gray-400 hover:text-gray-600 relative rounded-full hover:bg-gray-100"
              >
                <ShoppingBag className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <User className="h-6 w-6" />
                </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {user ? (
                        <>
                          <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            {user.email}
                          </div>
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            My Orders
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/login"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Sign in
                          </Link>
                          <Link
                            to="/register"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Create account
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          <button 
            className="md:hidden p-2 rounded-full hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 mt-2 py-2">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {categories.map((category: GameCategory) => (
                <div key={category.name}>
                  <button
                    onClick={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {category.name}
                  </button>
                  {activeCategory === category.name && (
                    <div className="px-4 py-2 space-y-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Featured</h4>
                        {category.featured.map((item: CategoryItem) => (
                          <a
                            key={item.name}
                            href={item.href}
                            className="block pl-4 py-1 text-sm text-gray-600 hover:text-black"
                          >
                            {item.name}
                          </a>
                        ))}
                      </div>
                      {category.sections.map((section: { name: string; items: CategoryItem[] }) => (
                        <div key={section.name} className="space-y-2">
                          <h4 className="font-medium text-gray-900">{section.name}</h4>
                          {section.items.map((item: CategoryItem) => (
                            <a
                              key={item.name}
                              href={item.href}
                              className="block pl-4 py-1 text-sm text-gray-600 hover:text-black"
                            >
                              {item.name}
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
