import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SUPPORT_EMAIL } from '../config';

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to store
        </Link>

        <h1 className="text-4xl font-bold mb-4">How It Works</h1>
        <p className="text-gray-300 text-lg mb-10">
          We help gamers save money by giving pre-owned digital game access a second life.
        </p>

        <div className="space-y-10 text-gray-200">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Gamers sell access they no longer use</h2>
            <p>
              Many players finish a game and no longer need access to it.
              They securely transfer the account access to our platform so the game can be enjoyed by someone else instead of sitting unused.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. We verify and secure the account</h2>
            <p>
              Our team checks the account and updates the login credentials to ensure it is safe and ready for a new user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. The listing is offered at a discounted price</h2>
            <p>
              Because these are previously used accesses, they can be offered at{' '}
              <strong className="text-white">significantly lower prices than traditional stores</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. You place your order</h2>
            <p>
              Once you purchase a game from our store, your order is processed and prepared for delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Access is delivered to you</h2>
            <p>
              Within the delivery window, you receive the account login details along with instructions on how to access your game.
            </p>
          </section>

          <section className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-2">Why prices are so low</h2>
            <p>
              By re-circulating digital game access that players no longer use, we reduce waste and pass the savings on to new players.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Delivery time</h2>
            <p>
              Orders are typically delivered within <strong className="text-white">24 hours</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Need help?</h2>
            <p>
              If you have any questions about your order, our support team is always available.
            </p>
            <p className="mt-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage;
