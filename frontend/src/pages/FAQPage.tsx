import { Link } from 'react-router-dom';
import FAQSection from '../components/FAQSection';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="text-purple-400 hover:text-purple-300">
          ← Back to home
        </Link>
      </div>
      <FAQSection />
    </div>
  );
}

