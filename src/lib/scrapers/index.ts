import { createClient } from '@supabase/supabase-js';
import { AWARD_CHARTS, Zone } from './awardCharts'; 

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runScraper() {
  console.log("Starting Award Chart Sync...");
  
  // The fully expanded list of popular routes
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

  for (const route of routes) {
    for (const [airline, zones] of Object.entries(AWARD_CHARTS)) {
      const data = zones[route.zone];
      
      // Skip if data is undefined or if the airline doesn't operate this route (points = 0)
      if (!data || data.economy === 0) continue;

      const payload = {
        origin: route.origin,
        dest: route.dest,
        flight_class: 'Economy',
        partner: data.partner,
        program: data.program,
        ratio: data.ratio,
        points: data.economy.toString(),
        taxes: '₹2000', 
        description: data.description,
        tags: JSON.stringify(data.tags)
      };

      const { error } = await supabase.from('flight_routes').upsert(payload, { 
        onConflict: 'origin,dest,flight_class,partner' 
      });
      
      if (error) console.error(`Error syncing ${airline} for ${route.origin}-${route.dest}:`, error);
    }
  }
  console.log("Sync complete.");
}

runScraper();