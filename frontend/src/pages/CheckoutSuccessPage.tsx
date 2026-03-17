import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORT_EMAIL } from '../config';
import { apiFetch } from '../utils/apiFetch';

interface Order {
  _id: string;
  status: string;
  totalInCad: number;
  createdAt: string;
  adminMessage?: string;
  items: { quantity: number; title?: string; game?: { title?: string } }[];
}

function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !token) {
      if (!sessionId) setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`/orders/by-session/${encodeURIComponent(sessionId)}`, {
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
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load order');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  const orderShortId = order?._id ? order._id.slice(-6).toUpperCase() : null;
  const step2Active = order?.status === 'paid' || order?.status === 'in_progress';
  const step3Active = !!order?.adminMessage;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || (!order && !sessionId)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-10 px-4 flex flex-col items-center justify-center">
        <p className="text-red-300 mb-4">{error || 'Invalid checkout session.'}</p>
        <Link to="/orders" className="text-purple-400 hover:text-purple-300">
          View My Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-10 px-4 flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">Loading your order…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Thank you for your order</h1>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-6">
          <p className="text-gray-300 font-mono text-lg">
            Order #{orderShortId}
          </p>

          <div className="space-y-2 text-gray-200">
            <p><span className="text-gray-400">Status:</span> Payment received</p>
            <p><span className="text-gray-400">Processing:</span> Supplier verification</p>
            <p><span className="text-gray-400">Estimated delivery:</span> within 24 hours</p>
            <p>
              <span className="text-gray-400">Support:</span>{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          {/* Order progress bar */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600/80 text-white">
                  <Check className="w-5 h-5" />
                </span>
                <span className="text-gray-300">Order received</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-gray-600" />
              <div className="flex flex-col items-center gap-1">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${step2Active ? 'bg-amber-500/80 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {step3Active ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </span>
                <span className="text-gray-300">Processing</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-gray-600" />
              <div className="flex flex-col items-center gap-1">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${step3Active ? 'bg-green-600/80 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {step3Active ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </span>
                <span className="text-gray-300">Delivery</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4 flex flex-col gap-2">
            <p className="text-gray-400 text-sm">Items in this order:</p>
            {order.items?.map((item, idx) => (
              <p key={idx} className="text-gray-200 text-sm">
                {item.quantity} × {item.game?.title || item.title || 'Game'}
              </p>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-gray-400 text-sm">
          You can track this order and receive delivery details from{' '}
          <Link to="/orders" className="text-purple-400 hover:text-purple-300">
            My Orders
          </Link>.
        </p>
      </div>
    </div>
  );
}

export default CheckoutSuccessPage;
