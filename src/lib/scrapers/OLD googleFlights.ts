import { createClient } from '@supabase/supabase-js';

// Setup Supabase (Using Service Role to bypass RLS policies during backend insertion)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERPAPI_KEY = process.env.SERPAPI_KEY!;

export async function fetchGoogleFlights(departure_id: string, arrival_id: string, outbound_date: string) {
  const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departure_id}&arrival_id=${arrival_id}&outbound_date=${outbound_date}&currency=INR&hl=en&api_key=${SERPAPI_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.best_flights || data.best_flights.length === 0) {
      console.log(`No flights found for ${departure_id} to ${arrival_id}`);
      return;
    }

    // Grab the absolute cheapest "best" flight
    const bestFlight = data.best_flights[0];
    
    // Google frequently provides a "typical price" range data point
    const typicalLow = data.price_insights?.typical_price_range?.[0] || bestFlight.price + 5000;
    
    // Grade the deal
    let grade = 'B';
    if (bestFlight.price < typicalLow * 0.7) grade = 'A+';
    else if (bestFlight.price < typicalLow * 0.85) grade = 'A';
    else if (bestFlight.price < typicalLow) grade = 'B+';

    const deal = {
      origin: departure_id,
      destination: arrival_id,
      airline: bestFlight.flights[0].airline,
      price: bestFlight.price,
      historical_avg: typicalLow,
      departure_date: outbound_date,
      source: 'Google Flights',
      deal_grade: grade,
      deal_url: `https://www.google.com/travel/flights?q=Flights%20to%20${arrival_id}%20from%20${departure_id}%20on%20${outbound_date}`
    };

    // Insert into Supabase
    await supabase.from('flight_deals').insert([deal]);
    console.log(`✅ Saved Deal: ${departure_id} -> ${arrival_id} for ₹${bestFlight.price}`);

  } catch (error) {
    console.error(`Error fetching flights for ${departure_id}:`, error);
  }
}