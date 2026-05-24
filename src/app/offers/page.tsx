import { OffersFeed } from '@/components/offers/OffersFeed';
 
export default function OffersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Latest Offers</h1>
          <p className="mt-1 text-gray-500">Current credit card offers and bonuses</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OffersFeed />
      </main>
    </div>
  );
}
