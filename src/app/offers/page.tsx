// src/app/offers/page.tsx
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for the Server Component
// These keys were successfully baked into your build environment!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Revalidate this page every hour (3600 seconds)
// This utilizes Next.js ISR so Cloudflare serves it instantly from the edge cache!
export const revalidate = 3600; 

export default async function OffersPage() {
  // Fetch the normalized and deduplicated offers from your database
  const { data: offers, error } = await supabase
    .from('card_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching offers:", error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Latest Card Offers
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl">
            Discover the most recent promotions, multipliers, and discounts across the credit card network.
          </p>
        </div>

        {/* Error / Empty State */}
        {!offers || offers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-lg">No active offers found right now. Check back soon!</p>
          </div>
        ) : (
          /* Offers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offers.map((offer) => (
              <div 
                key={offer.id} 
                className="bg-white flex flex-col rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="p-6 flex-grow flex flex-col">
                  
                  {/* Top Badges */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {offer.card_variant || 'All Variants'}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {offer.source}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {offer.title}
                  </h3>
                  
                  <div className="mt-2 flex-grow">
                    {/* The description your scraper fought so hard to maximize! */}
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {offer.description}
                    </p>
                  </div>
                  
                  {/* Validity Date */}
                  {offer.validity_date && (
                    <div className="mt-4 text-xs font-medium text-gray-500">
                      🗓️ {offer.validity_date}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <a
                    href={offer.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    View Full Offer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}