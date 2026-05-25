import Link from 'next/link';
import { CreditCard, Tag, BarChart3, ArrowRight } from 'lucide-react';
 
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Indian Credit Card Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Compare credit cards, discover offers, and find the perfect card for your needs
          </p>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto mt-12">
          {/* Compare Cards */}
          <Link
            href="/compare"
            className="group rounded-xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="rounded-lg bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Compare Cards
            </h2>
            <p className="text-gray-600 mb-4">
              Side-by-side comparison of credit cards from all major Indian banks
            </p>
            <span className="inline-flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
              Start comparing <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </Link>
          
          {/* Latest Offers */}
          <Link
            href="/offers"
            className="group rounded-xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="rounded-lg bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Latest Offers
            </h2>
            <p className="text-gray-600 mb-4">
              Current offers, bonuses, and cashback deals from credit cards
            </p>
            <span className="inline-flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
              View offers <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </Link>
          
          {/* Search Analytics */}
          <Link
            href="/analytics"
            className="group rounded-xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="rounded-lg bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Search Analytics
            </h2>
            <p className="text-gray-600 mb-4">
              See what users are searching for and trending queries
            </p>
            <span className="inline-flex items-center text-purple-600 font-medium group-hover:gap-2 transition-all">
              View analytics <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </Link>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-600">20+</p>
              <p className="text-gray-600 mt-1">Banks</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">100+</p>
              <p className="text-gray-600 mt-1">Cards</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">50+</p>
              <p className="text-gray-600 mt-1">Offers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">Real-time</p>
              <p className="text-gray-600 mt-1">Updates</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}