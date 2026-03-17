import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  game: {
    _id: string;
    title: string;
    slug: string;
    imageUrl: string;
  } | null;
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

import { API_BASE } from '../config';

function AdminOrdersPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
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

  const handleSendMessage = async (orderId: string) => {
    const body = messageDraft[orderId] ?? '';
    if (!token) return;
    setSendingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/message`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminMessage: body })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  adminMessage: data.data.adminMessage,
                  adminMessageSentAt: data.data.adminMessageSentAt
                }
              : o
          )
        );
        setExpandedId(null);
        setMessageDraft((prev) => ({ ...prev, [orderId]: '' }));
      } else {
        setError(data.message || 'Failed to save message');
      }
    } catch (e) {
      setError('Failed to save message');
    } finally {
      setSendingId(null);
    }
  };

  const openMessageForm = (order: Order) => {
    setExpandedId(order._id);
    setMessageDraft((prev) => ({
      ...prev,
      [order._id]: order.adminMessage ?? prev[order._id] ?? ''
    }));
  };

  const handleStatusChange = async (orderId: string, newStatus: 'paid' | 'in_progress' | 'closed') => {
    if (!token) return;
    setStatusUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: data.data.status } : o))
        );
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (e) {
      setError('Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-300">
          <h1 className="text-2xl font-bold mb-2">Admin access only</h1>
          <Link to="/" className="text-purple-400 hover:text-purple-300">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>
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
          <p className="text-gray-400">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-3"
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
                    {order.email && (
                      <p className="text-sm text-gray-400">
                        Email: <span className="text-gray-200">{order.email}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Status:</label>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value as 'paid' | 'in_progress' | 'closed')
                        }
                        disabled={statusUpdatingId === order._id}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                      >
                        <option value="paid">Paid</option>
                        <option value="in_progress">In progress</option>
                        <option value="closed">Closed</option>
                      </select>
                      {statusUpdatingId === order._id && (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-purple-300">
                      ${order.totalInCad.toFixed(2)} CAD
                    </p>
                    <p className="text-xs text-gray-400">
                      ৳{order.totalInBdt.toLocaleString()} BDT
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-300">
                      <span>
                        {item.quantity} × {(item.game?.title || item.title || 'Unknown')}
                      </span>
                      <span>
                        ${(item.priceInCad * item.quantity).toFixed(2)} CAD (
                        ৳{(item.priceInBdt * item.quantity).toLocaleString()} )
                      </span>
                    </div>
                  ))}
                </div>

                {/* Admin: send message to customer (game key, email, password, instructions) */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  {order.adminMessage && (
                    <p className="text-xs text-green-400 mb-2">
                      Message sent{' '}
                      {order.adminMessageSentAt
                        ? new Date(order.adminMessageSentAt).toLocaleString()
                        : ''}
                    </p>
                  )}
                  {expandedId === order._id ? (
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-400">
                        Message to customer (game key, email, password, instructions)
                      </label>
                      <textarea
                        className="w-full min-h-[180px] px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Paste game key, login email, password, and any instructions here..."
                        value={messageDraft[order._id] ?? order.adminMessage ?? ''}
                        onChange={(e) =>
                          setMessageDraft((prev) => ({ ...prev, [order._id]: e.target.value }))
                        }
                        disabled={sendingId === order._id}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendMessage(order._id)}
                          disabled={sendingId === order._id}
                          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-sm"
                        >
                          {sendingId === order._id ? 'Saving…' : 'Save / Send to customer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedId(null);
                            setMessageDraft((prev) => ({ ...prev, [order._id]: order.adminMessage ?? '' }));
                          }}
                          className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openMessageForm(order)}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      {order.adminMessage ? 'Edit message to customer' : 'Send message to customer'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrdersPage;

