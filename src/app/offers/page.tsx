import { createClient } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';

// Force the page to be dynamic (disable caching)
export const dynamic = 'force-dynamic';

// Initialize Supabase (Server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function OffersPage() {
  const { data: offers, error } = await supabase
    .from('card_offers')
    .select('*')
    .order('created_at', { ascending: false });

console.log("DEBUG: Number of offers fetched from DB:", offers?.length);

  if (error) {
    return <div className="p-10 text-rose-600 font-semibold">Error loading data: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">Latest Card Offers</h1>
        
        {offers && offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: any) => {
              const CardWrapper = offer.source_url ? 'a' : 'div';
              const wrapperProps = offer.source_url 
                ? { href: offer.source_url, target: "_blank", rel: "noopener noreferrer" } 
                : {};

              return (
                <CardWrapper 
                  key={offer.id} 
                  {...wrapperProps}
                  className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 block cursor-pointer"
                >
                  <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {offer.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                    {offer.description}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
                    <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {offer.source}
                    </span>
                    {offer.source_url && (
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                    )}
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No offers found. Run your scraper to populate the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}