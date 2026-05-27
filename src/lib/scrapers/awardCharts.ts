export interface AwardRate {
  program: string;
  partner: string;
  ratio: string;
  economy: number;
  premiumEconomy: number;
  business: number;
  first: number;
  tags: { text: string; color: 'green' | 'blue' | 'amber' }[];
  description: string;
}

export type Zone = 'domestic_india' | 'south_asia' | 'middle_east_africa' | 'europe' | 'north_america' | 'australia_pacific';

export const AWARD_CHARTS: Record<string, Record<Zone, AwardRate>> = {
  air_india: {
    domestic_india: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 5000, premiumEconomy: 7500, business: 10000, first: 15000, tags: [{ text: 'Best for India', color: 'green' }], description: 'Air India Flying Returns — best value on domestic and regional Indian routes.' },
    south_asia: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 12000, premiumEconomy: 18000, business: 25000, first: 40000, tags: [{ text: 'Good Value', color: 'blue' }], description: 'Air India Flying Returns — solid value for South Asia.' },
    middle_east_africa: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 20000, premiumEconomy: 30000, business: 45000, first: 70000, tags: [{ text: 'Good Value', color: 'blue' }], description: 'Air India Flying Returns for Middle East and Africa.' },
    europe: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 35000, premiumEconomy: 52000, business: 70000, first: 110000, tags: [{ text: 'Popular Route', color: 'blue' }], description: 'Air India Flying Returns — direct flights.' },
    north_america: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 55000, premiumEconomy: 75000, business: 95000, first: 140000, tags: [{ text: 'Direct Flights', color: 'amber' }], description: 'Air India Flying Returns — nonstop to US.' },
    australia_pacific: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 50000, premiumEconomy: 70000, business: 90000, first: 130000, tags: [], description: 'Air India Flying Returns for Australia.' },
  },
  // Add other airlines here as needed following the same pattern
};