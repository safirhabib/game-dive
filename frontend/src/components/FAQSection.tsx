import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqItem = { q: string; a: string };

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How does delivery work?',
    a: 'After payment, your order is verified and delivered within 24 hours. You can track progress anytime in My Orders.'
  },
  {
    q: 'When will I receive my game?',
    a: 'Most orders are delivered within 24 hours. If anything needs clarification, we’ll message you directly on your order.'
  },
  {
    q: 'Can I cancel my order?',
    a: 'Yes — you can cancel with a full refund within 48 hours as long as delivery has not been completed.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept PayPal and major debit/credit cards via PayPal’s secure checkout.'
  },
  {
    q: 'Need help?',
    a: 'Reach out anytime via the support email shown on your order page. We typically respond within 12 hours.'
  }
];

export default function FAQSection({ compact = false }: { compact?: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className={compact ? 'py-10 px-4 sm:px-6 lg:px-8' : 'py-16 px-4 sm:px-6 lg:px-8'}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">FAQ</h2>
          <p className="text-gray-400 mt-3">
            Quick answers about delivery, refunds, and payments.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div
                key={item.q}
                className="bg-gray-800/50 border border-gray-700/60 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 p-4 text-left"
                  onClick={() => setOpenIdx(open ? null : idx)}
                >
                  <span className="text-white font-semibold">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-4 text-gray-300 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

