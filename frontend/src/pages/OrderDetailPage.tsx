import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORT_EMAIL } from '../config';
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

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch(`/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.success) {
            setOrder(data.data);
            setError(null);
          } else {
            setError(data.message || 'Order not found');
          }
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-10 px-4 flex flex-col items-center justify-center">
        <p className="text-red-300 mb-4">{error || 'Order not found'}</p>
        <Link to="/orders" className="text-purple-400 hover:text-purple-300">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Order details</h1>
          <Link to="/orders" className="text-purple-400 hover:text-purple-300">
            ← My Orders
          </Link>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">Order ID</p>
              <p className="text-gray-200 font-mono text-sm">{order._id}</p>
              <p className="text-sm text-gray-400 mt-2">
                Placed: {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              {order.email && (
                <p className="text-sm text-gray-400">Email: {order.email}</p>
              )}
            </div>
            <div className="text-right">
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
              <p className="mt-2 text-2xl font-bold text-purple-300">
                ${order.totalInCad.toFixed(2)} CAD
              </p>
            </div>
          </div>

          {/* Order progress bar */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Order progress</h3>
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600/80 text-white">
                  <Check className="w-5 h-5" />
                </span>
                <span className="text-gray-300">Order received</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-gray-600" />
              <div className="flex flex-col items-center gap-1">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${(order.status === 'paid' || order.status === 'in_progress') ? 'bg-amber-500/80 text-white' : order.adminMessage ? 'bg-green-600/80 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {order.adminMessage ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </span>
                <span className="text-gray-300">Processing</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-gray-600" />
              <div className="flex flex-col items-center gap-1">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${order.adminMessage ? 'bg-green-600/80 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {order.adminMessage ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </span>
                <span className="text-gray-300">Delivery</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400">
              Questions? Contact us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h2 className="text-lg font-semibold mb-3">Items</h2>
            <ul className="space-y-2">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between text-gray-300">
                  <span>
                    {item.quantity} × {(item.game?.title || item.title || 'Unknown')}
                  </span>
                  <span>
                    ${(item.priceInCad * item.quantity).toFixed(2)} CAD
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {order.adminMessage && (
            <div className="border-t border-gray-700 pt-4">
              <h2 className="text-lg font-semibold mb-2 text-green-400 flex items-center gap-2">
                Message from seller
                {order.adminMessageSentAt && (
                  <span className="text-xs font-normal text-gray-500">
                    ({new Date(order.adminMessageSentAt).toLocaleString()})
                  </span>
                )}
              </h2>
              <div className="bg-gray-900/80 border border-green-800/50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-200">
                  {order.adminMessage}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;
