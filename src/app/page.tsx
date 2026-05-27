import Link from 'next/link';
import { CreditCard, Tag, ArrowRight, Plane } from 'lucide-react';
 
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-grow flex flex-col justify-center w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="text-center w-full max-w-screen-md mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            Indian Credit Card Portal
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12">
            Compare credit cards, discover offers, and find the perfect card for your lifestyle and travel needs.
          </p>
        </div>
        
        {/* Feature Cards - Fluid Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-screen-xl mx-auto">
          
          {/* Compare Cards */}
          <Link
            href="/compare"
            className="group rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >
            <div className="inline-flex p-4 rounded-xl bg-blue-50 self-start mb-6 group-hover:bg-blue-100 transition-colors">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Compare Cards
            </h2>
            <p className="text-gray-600 mb-6 flex-grow text-lg leading-relaxed">
              Side-by-side comparison of credit cards from all major Indian banks to maximize your rewards.
            </p>
            <span className="inline-flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all mt-auto text-lg">
              Start comparing <ArrowRight className="w-5 h-5 ml-1" />
            </span>
          </Link>
          
          {/* Latest Offers */}
          <Link
            href="/offers"
            className="group rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >
            <div className="inline-flex p-4 rounded-xl bg-green-50 self-start mb-6 group-hover:bg-green-100 transition-colors">
              <Tag className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Latest Offers
            </h2>
            <p className="text-gray-600 mb-6 flex-grow text-lg leading-relaxed">
              Current offers, welcome bonuses, and limited-time cashback deals from top credit cards.
            </p>
            <span className="inline-flex items-center text-green-600 font-medium group-hover:gap-2 transition-all mt-auto text-lg">
              View offers <ArrowRight className="w-5 h-5 ml-1" />
            </span>
          </Link>

          {/* Points Calculator */}
          <Link
            href="/calculator"
            className="group rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >
            <div className="inline-flex p-4 rounded-xl bg-indigo-50 self-start mb-6 group-hover:bg-indigo-100 transition-colors">
              <Plane className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Points Calculator
            </h2>
            <p className="text-gray-600 mb-6 flex-grow text-lg leading-relaxed">
              Discover exactly how many points you need and which card earns the most for your next flight.
            </p>
            <span className="inline-flex items-center text-indigo-600 font-medium group-hover:gap-2 transition-all mt-auto text-lg">
              Calculate Now <ArrowRight className="w-5 h-5 ml-1" />
            </span>
          </Link>
          
        </div>
      </div>
      
      {/* Stats Section - Fluid Widths */}
      <div className="bg-white border-t border-gray-100 w-full mt-auto">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 text-center w-full">
            <div className="flex flex-col items-center">
              <p className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">20+</p>
              <p className="text-gray-500 font-medium text-lg">Banks</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">100+</p>
              <p className="text-gray-500 font-medium text-lg">Cards</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">50+</p>
              <p className="text-gray-500 font-medium text-lg">Offers</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">Live</p>
              <p className="text-gray-500 font-medium text-lg">Data Updates</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}