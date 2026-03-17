import { Link } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { SUPPORT_EMAIL } from '../config';

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
                <Link to="/section/on-sale" className="hover:text-white transition-colors">
                  On Sale
                </Link>
              </li>
              <li>
                <Link to="/section/pc-games" className="hover:text-white transition-colors">
                  PC Games
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Support</h3>
            <p className="text-gray-400 mb-2">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p className="text-gray-500 text-sm">Average response time: &lt; 12 hours</p>
            <ul className="space-y-2 text-gray-400 mt-3">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
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