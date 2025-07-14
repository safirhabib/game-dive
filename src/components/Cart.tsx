import React from 'react';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (gameId: string, quantity: number) => void;
  onRemoveItem: (gameId: string) => void;
  onBack: () => void;
}

function Cart({ items, onUpdateQuantity, onRemoveItem, onBack }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.game.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Continue Shopping</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Add some games to get started!</p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Browse Games
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.game.id}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.game.image}
                      alt={item.game.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{item.game.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{item.game.genre}</p>
                      <p className="text-purple-400 font-semibold">${item.game.price}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onUpdateQuantity(item.game.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Minus className="h-4 w-4 text-white" />
                      </button>
                      
                      <span className="text-white font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => onUpdateQuantity(item.game.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        ${(item.game.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.game.id)}
                        className="text-red-400 hover:text-red-300 transition-colors mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Tax</span>
                    <span>${(total * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Total</span>
                      <span>${(total * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                  Proceed to Checkout
                </button>

                <p className="text-gray-400 text-sm text-center mt-4">
                  Secure checkout with 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;