import { Gamepad2 } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-slate-900/40 backdrop-blur-sm py-12 px-4 mt-16">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-white">Game Dive</span>
            </div>
            <p className="text-gray-400">Your ultimate destination for gaming excellence.</p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Store</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  New Releases
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Top Sellers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Coming Soon
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Free Games
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Refunds
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  System Requirements
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Forums
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Reddit
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Game Dive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;