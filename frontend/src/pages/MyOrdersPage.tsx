import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

interface OrderItem {
  game: { _id: string; title: string; slug: string; imageUrl: string } | null;
  title: string;
  quantity: number;
  priceInBdt: number;
  priceInCad: number;
}

interface Order {
  _id: string;
  status: 'paid' | 'in_progress' | 'closed';
  totalInBdt: number;
  totalInCad: number;
  email?: string;
  createdAt: string;
  items: OrderItem[];
  adminMessage?: string;
  adminMessageSentAt?: string;
}

function MyOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/orders/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.success) {
            setOrders(Array.isArray(data.data) ? data.data : []);
            setError(null);
          } else {
            setError(data.message || 'Failed to load orders');
          }
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Link to="/" className="text-purple-400 hover:text-purple-300">
            Back to home
          </Link>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-900/40 border border-red-700 rounded-lg p-3">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <p className="text-gray-400">You have no orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="block bg-gray-800/60 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-400">
                      Order ID: <span className="text-gray-200">{order._id}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Placed:{' '}
                      {new Date(order.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {order.adminMessage && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600/50 text-green-200">
                        Message from seller
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'paid'
                          ? 'bg-green-600/70 text-green-50'
                          : order.status === 'in_progress'
                          ? 'bg-amber-600/70 text-amber-50'
                          : 'bg-gray-600/70 text-gray-200'
                      }`}
                    >
                      {order.status === 'in_progress' ? 'In progress' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-lg font-bold text-purple-300">
                      ${order.totalInCad.toFixed(2)} CAD
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3 mt-2 space-y-1">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      {item.quantity} × {(item.game?.title || item.title || 'Unknown')}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-500">+{order.items.length - 3} more</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;
