import { Link } from 'react-router-dom';

function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-2">Checkout cancelled</h1>
      <p className="text-gray-400 mb-6">Your cart is unchanged. You can continue shopping or try again when ready.</p>
      <Link
        to="/cart"
        className="text-purple-400 hover:text-purple-300 font-medium"
      >
        Back to cart
      </Link>
    </div>
  );
}

export default CheckoutCancelPage;
