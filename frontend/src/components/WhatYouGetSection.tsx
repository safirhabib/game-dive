import { Cog, Mail, ShoppingCart, BadgePercent } from 'lucide-react';
import gamingPic1 from '../assets/gaming_pic_1.jpg';
import gamingPic2 from '../assets/gaming_pic_2.jpg';
import gamingPic3 from '../assets/gaming_pic_3.jpg';

const EXTRA_COVER_URL =
  'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=600';

const COVER_TILES: { src: string; pos: string }[] = [
  { src: gamingPic1, pos: 'object-center' },
  { src: gamingPic2, pos: 'object-center' },
  { src: gamingPic3, pos: 'object-center' },
  { src: EXTRA_COVER_URL, pos: 'object-center' }
];

function Step({
  icon,
  title,
  text,
  idx
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  idx: number;
}) {
  return (
    <div className="group rounded-2xl border border-gray-700/60 bg-gray-800/40 p-4 transition-all hover:-translate-y-0.5 hover:border-purple-500/40 hover:bg-gray-800/60">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-300 transition-colors group-hover:bg-purple-600/30">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400">Step {idx}</p>
          <p className="text-white font-semibold">{title}</p>
          <p className="text-sm text-gray-300 mt-1 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function WhatYouGetSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: visuals */}
          <div className="relative">
            <div className="rounded-3xl border border-gray-700/60 bg-gray-800/30 p-5 overflow-hidden">
              <div className="grid grid-cols-2 gap-3">
                {COVER_TILES.map((t, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-700/50">
                    <img
                      src={t.src}
                      alt=""
                      className={`h-full w-full object-cover ${t.pos} transition-transform duration-500 hover:scale-105`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-300">
                  <BadgePercent className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm">Trusted checkout • Fast delivery</span>
                </div>
                <span className="text-xs text-gray-500">Trusted by 100+ customers</span>
              </div>
            </div>

            {/* floating badge */}
            <div className="absolute -top-4 -left-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-white shadow-xl animate-pulse">
              <p className="text-sm font-bold">Save up to 70%</p>
            </div>
          </div>

          {/* RIGHT: content */}
          <div className="space-y-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-200">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                What you’re getting
              </p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
                What You’re Getting <span className="text-purple-300">(and why it’s so cheap)</span>
              </h2>
              <p className="mt-3 text-gray-300 leading-relaxed max-w-xl">
                You’re getting access to games at significantly reduced prices through our secure delivery system.
              </p>
              <p className="mt-3 text-gray-300 leading-relaxed max-w-xl">
                We source pre-owned Steam game access from players who no longer use it, then reset it to fresh credentials
                (a new email and password — often via a temporary email) before delivery. That’s how we can price it dirt cheap.
              </p>
              <p className="mt-2 text-sm text-gray-400">No subscription. One-time purchase.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">How it works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Step
                  idx={1}
                  icon={<ShoppingCart className="h-5 w-5" />}
                  title="Order"
                  text="Place your order securely through checkout."
                />
                <Step
                  idx={2}
                  icon={<Cog className="h-5 w-5" />}
                  title="Processing"
                  text="We prepare and verify your access."
                />
                <Step
                  idx={3}
                  icon={<Mail className="h-5 w-5" />}
                  title="Delivery"
                  text="Receive your details within 24 hours."
                />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Why it’s so cheap</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                  <span>No retail markup</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                  <span>Direct sourcing</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                  <span>Lower overhead costs</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                  <span>Efficient delivery workflow</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-700/60 bg-gray-800/30 p-4">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-300">
                <span>✔ Secure payments via PayPal</span>
                <span>✔ Delivery within 24 hours</span>
                <span>✔ Support available 7 days a week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

