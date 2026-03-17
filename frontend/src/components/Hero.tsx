import React from 'react';
import { Play, Star, TrendingUp } from 'lucide-react';

interface HeroProps {
  onViewGames?: () => void;
}

function Hero({ onViewGames = () => {} }: HeroProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1600)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-purple-900/50 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-purple-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-purple-500/30">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">Featured Game Collection</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Discover Epic
          <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Gaming Adventures
          </span>
        </h1>

        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Immerse yourself in worlds beyond imagination. From indie gems to AAA blockbusters, 
          find your next gaming obsession in our curated collection.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={onViewGames}
            className="group flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>Explore Games</span>
          </button>

          <div className="flex items-center space-x-4 text-gray-300">
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="font-semibold">4.8/5</span>
            </div>
            <span className="text-gray-500">•</span>
            <span>500+ Games</span>
            <span className="text-gray-500">•</span>
            <span>1M+ Players</span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-10 w-16 h-16 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-500" />
    </section>
  );
}

export default Hero;