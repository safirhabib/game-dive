import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE, PAYPAL_CLIENT_ID } from '../config';
import { useAuth } from '../context/AuthContext';
import { CartItem } from '../types';
import { apiFetch } from '../utils/apiFetch';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        style?: { layout?: string; color?: string; shape?: string; label?: string; tagline?: boolean };
      }) => { render: (selector: string | HTMLElement) => Promise<void> };
    };
  }
}

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (gameId: string, quantity: number) => void;
  onRemove: (gameId: string) => void;
  onClear: () => void;
}

function safePrice(item: CartItem): number {
  const p = item?.game?.price;
  return typeof p?.currentInCAD === 'number' ? p.currentInCAD : 0;
}

function savingsAmount(item: CartItem, quantity: number): number {
  const p = item?.game?.price;
  const orig = typeof p?.originalInCAD === 'number' ? p.originalInCAD : 0;
  const curr = typeof p?.currentInCAD === 'number' ? p.currentInCAD : 0;
  return (orig - curr) * quantity;
}

function Cart({ cartItems: items, onUpdateQuantity, onRemove: onRemoveItem, onClear }: CartProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const paypalRef = useRef<HTMLDivElement>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const validItems = items.filter((item) => item?.game?._id && typeof item.quantity === 'number');
  const total = validItems.reduce((sum, item) => sum + safePrice(item) * item.quantity, 0);
  const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartPayload = validItems.map((item) => ({
    gameId: item.game._id,
    quantity: item.quantity,
  }));

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || validItems.length === 0 || !token || !paypalRef.current) return;
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }
    const script = document.createElement('script');
    // Disable Pay Later to avoid extra clutter, but keep card funding enabled.
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=CAD&disable-funding=paylater`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [PAYPAL_CLIENT_ID, validItems.length, token]);

  const cartPayloadRef = useRef(cartPayload);
  cartPayloadRef.current = cartPayload;

  useEffect(() => {
    if (!paypalReady || !window.paypal || !paypalRef.current || !token || validItems.length === 0) return;
    paypalRef.current.innerHTML = '';
    window.paypal
      .Buttons({
        createOrder: async () => {
          const res = await apiFetch('/payments/create-order', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: cartPayloadRef.current }),
          });
          const data = await res.json();
          if (!res.ok || !data.orderId) {
            throw new Error(data.message || 'Failed to create order');
          }
          return data.orderId;
        },
        onApprove: async (data) => {
          try {
            const res = await apiFetch('/payments/capture', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
              toast.error(result.message || 'Payment failed');
              return;
            }
            onClear();
            navigate(`/checkout/success?session_id=${encodeURIComponent(data.orderID)}`);
          } catch (e) {
            toast.error('Payment failed');
          }
        },
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'paypal',
          tagline: false
        },
      })
      .render(paypalRef.current);
  }, [paypalReady, token, navigate, validItems.length]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Continue Shopping</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-white">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>

        {validItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Add some games to get started!</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-3 space-y-4">
              {validItems.map((item) => (
                <div
                  key={item.game._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex flex-col sm:flex-row gap-6"
                >
                  <div className="w-full sm:w-32 h-40 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.game.imageUrl}
                      alt={item.game.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {item.game.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">{item.game.platform}</p>
                        {item.game.isInStock === false && (
                          <span className="inline-block bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full mb-2">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          ${(safePrice(item) * item.quantity).toFixed(2)} CAD
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-400">
                            ${safePrice(item).toFixed(2)} each
                          </p>
                        )}
                        {(item.game?.price?.discount ?? 0) > 0 && (
                          <p className="text-xs text-green-400">
                            {'You save: $' + savingsAmount(item, item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUpdateQuantity(item.game._id, item.quantity - 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full ${
                            item.quantity > 1 ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 cursor-not-allowed opacity-50'
                          } text-white transition-colors`}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.game._id, item.quantity + 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full ${
                            item.game.isInStock ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 cursor-not-allowed opacity-50'
                          } text-white transition-colors`}
                          disabled={item.game.isInStock === false}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.game._id)}
                        className="text-gray-400 hover:text-red-400 transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-fit lg:sticky lg:top-6">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="text-white">${total.toFixed(2)} CAD</span>
                  </div>

                  {validItems.some(item => (item.game?.price?.discount ?? 0) > 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discounts</span>
                      <span className="text-green-400">
                        -${validItems.reduce((sum, item) => {
                          const p = item.game?.price;
                          const discount = ((p?.originalInCAD ?? 0) - (p?.currentInCAD ?? 0)) * item.quantity;
                          return sum + discount;
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-gray-700 pt-4">
                    <span className="text-lg font-bold text-white">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-400">${total.toFixed(2)} CAD</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                    <span>✔ Secure checkout</span>
                    <span>✔ Delivery within 24 hours</span>
                    <span>✔ Huge discounts compared to retail</span>
                    <span>✔ Dedicated support</span>
                    <span>✔ Cancel with full refund within 48 hours</span>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-3xl bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-white">Payment</h2>
                <span className="text-sm text-gray-400">Total: ${total.toFixed(2)} CAD</span>
              </div>

              {!token ? (
                <p className="text-amber-400 text-sm py-2">Please log in to checkout.</p>
              ) : validItems.some((item) => item.game.isInStock === false) ? (
                <button
                  type="button"
                  disabled
                  className="w-full font-bold py-4 px-6 rounded-xl bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Remove out of stock items to proceed
                </button>
              ) : !PAYPAL_CLIENT_ID ? (
                <p className="text-gray-400 text-sm py-2">PayPal is not configured.</p>
              ) : (
                <div className="min-h-[45px]">
                  <div className="mb-3 rounded-xl border border-gray-700/70 bg-gray-900/40 p-3">
                    <p className="text-xs text-gray-300">
                      Pay securely with PayPal or card. Card details are entered in PayPal&apos;s secure checkout.
                    </p>
                  </div>
                  {!paypalReady && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  )}
                  <div className="flex justify-center">
                    <div className="w-full max-w-xl rounded-xl border border-gray-700/70 bg-white/5 p-4">
                      <div ref={paypalRef} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;