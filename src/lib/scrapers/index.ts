import { createClient } from '@supabase/supabase-js';
import { AWARD_CHARTS, Zone } from './awardCharts'; 

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ==========================================
// DYNAMIC FLIGHT TAX ESTIMATOR (IN INR)
// ==========================================
function estimateFlightTaxes(zone: Zone, flightClass: string): string {
  let baseTax = 0;

  switch (zone) {
    case 'domestic_india': baseTax = 1200; break;
    case 'south_asia': baseTax = 3500; break;
    case 'middle_east_africa': baseTax = 5000; break;
    case 'australia_pacific': baseTax = 7500; break;
    case 'europe': baseTax = 14000; break;
    case 'north_america': baseTax = 10000; break;
    default: baseTax = 4000;
  }

  if (flightClass === 'Business') baseTax = Math.floor(baseTax * 1.8);
  else if (flightClass === 'First') baseTax = Math.floor(baseTax * 2.5);
  else if (flightClass === 'Premium Economy') baseTax = Math.floor(baseTax * 1.3);

  return `₹${baseTax.toLocaleString('en-IN')}`;
}

async function runScraper() {
  console.log("🚀 Starting Award Chart Sync...");
  
  const routes: { origin: string, dest: string, zone: Zone }[] = [
    { origin: 'DEL', dest: 'BOM', zone: 'domestic_india' },
    { origin: 'DEL', dest: 'BLR', zone: 'domestic_india' },
    { origin: 'DEL', dest: 'HYD', zone: 'domestic_india' },
    { origin: 'DEL', dest: 'MAA', zone: 'domestic_india' },
    { origin: 'DEL', dest: 'CCU', zone: 'domestic_india' },
    { origin: 'BOM', dest: 'BLR', zone: 'domestic_india' },
    { origin: 'BOM', dest: 'HYD', zone: 'domestic_india' },
    { origin: 'BOM', dest: 'MAA', zone: 'domestic_india' },
    { origin: 'BOM', dest: 'CCU', zone: 'domestic_india' },
    { origin: 'DEL', dest: 'DXB', zone: 'middle_east_africa' },
    { origin: 'BOM', dest: 'DXB', zone: 'middle_east_africa' },
    { origin: 'DEL', dest: 'DOH', zone: 'middle_east_africa' },
    { origin: 'BOM', dest: 'DOH', zone: 'middle_east_africa' },
    { origin: 'DEL', dest: 'AUH', zone: 'middle_east_africa' },
    { origin: 'DEL', dest: 'LHR', zone: 'europe' },
    { origin: 'BOM', dest: 'LHR', zone: 'europe' },
    { origin: 'DEL', dest: 'FRA', zone: 'europe' },
    { origin: 'DEL', dest: 'CDG', zone: 'europe' },
    { origin: 'DEL', dest: 'ZRH', zone: 'europe' },
    { origin: 'DEL', dest: 'JFK', zone: 'north_america' },
    { origin: 'DEL', dest: 'SFO', zone: 'north_america' },
    { origin: 'DEL', dest: 'ORD', zone: 'north_america' },
    { origin: 'BOM', dest: 'JFK', zone: 'north_america' },
    { origin: 'DEL', dest: 'SIN', zone: 'south_asia' },
    { origin: 'BOM', dest: 'SIN', zone: 'south_asia' },
    { origin: 'DEL', dest: 'SYD', zone: 'australia_pacific' },
    { origin: 'BOM', dest: 'MEL', zone: 'australia_pacific' },
  ];

// Map your internal keys to the UI labels
  const cabins = [
    { key: 'economy', label: 'Economy' },
    { key: 'premiumEconomy', label: 'Premium Economy' }, //  Fixed to match your interface!
    { key: 'business', label: 'Business' },
    { key: 'first', label: 'First' }
  ];

  for (const route of routes) {
    for (const [airline, zones] of Object.entries(AWARD_CHARTS)) {
      const data = zones[route.zone];
      if (!data) continue;

      // Dynamically loop through every cabin class available in your chart
      for (const cabin of cabins) {
        const points = data[cabin.key as keyof typeof data];
        
        // Skip if this specific airline doesn't have points listed for this cabin
        if (!points || typeof points !== 'number' || points === 0) continue;

        const payload = {
          origin: route.origin,
          dest: route.dest,
          flight_class: cabin.label,
          partner: data.partner,
          program: data.program,
          ratio: data.ratio,
          points: points.toString(),
          taxes: data.taxes !== undefined 
            ? `₹${data.taxes.toLocaleString('en-IN')}` 
            : estimateFlightTaxes(route.zone, cabin.label), 
          description: data.description || '',
          tags: JSON.stringify(data.tags || [])
        };

        const { error } = await supabase.from('flight_routes').upsert(payload, { 
          onConflict: 'origin,dest,flight_class,partner' 
        });
        
        if (error) {
          console.error(`⚠️ Database Error syncing ${airline} ${cabin.label} (${route.origin}-${route.dest}):`, error.message);
        }
      }
    }
  }
  console.log("✅ Sync complete.");
}

runScraper();