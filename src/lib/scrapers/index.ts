// src/lib/scrapers/index.ts

// REVERTED: Remove the .js extension so it resolves to awardCharts.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runScraper() {
  console.log("Starting Award Chart Sync...");
  
  const routes = [
    { origin: 'DEL', dest: 'LHR', zone: 'europe' },
    { origin: 'DEL', dest: 'DXB', zone: 'middle_east_africa' }
  ];

  for (const route of routes) {
    for (const [airline, zones] of Object.entries(AWARD_CHARTS)) {
      const data = zones[route.zone as Zone];
      if (!data) continue;

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
      
      if (error) console.error(`Error syncing ${airline}:`, error);
    }
  }
  console.log("Sync complete.");
}

runScraper();