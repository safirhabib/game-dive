import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../config';

export const NewsletterPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Show popup after 5 seconds of page load
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user has already subscribed (using localStorage)
      const hasSubscribed = localStorage.getItem('newsletterSubscribed');
      if (!hasSubscribed) {
        setIsOpen(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Subscription failed');
      }

      setStatus('success');
      setMessage(data.message || 'Thank you for subscribing!');
      localStorage.setItem('newsletterSubscribed', 'true');
      
      // Close popup after 3 seconds
      setTimeout(() => setIsOpen(false), 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Something went wrong. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Join Our Newsletter</h3>
          <p className="text-gray-600 mb-6">
            Subscribe to get the latest game updates, exclusive offers, and more!
          </p>
          
          {status === 'success' ? (
            <div className="bg-green-100 text-green-700 p-3 rounded-md">
              {message}
            </div>
          ) : status === 'error' ? (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={status === 'loading'}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}
          
          <p className="text-xs text-gray-500 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;
