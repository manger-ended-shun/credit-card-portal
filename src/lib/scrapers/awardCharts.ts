export interface AwardRate {
  program: string;
  partner: string;
  ratio: string;
  economy: number;
  premiumEconomy: number;
  business: number;
  first: number;
  taxes?: number; 
  tags: { text: string; color: 'green' | 'blue' | 'amber' }[];
  description: string;
}

export type Zone =
  | 'domestic_india'
  | 'south_asia'
  | 'middle_east_africa'
  | 'europe'
  | 'north_america'
  | 'australia_pacific';

export const AWARD_CHARTS: Record<string, Record<Zone, AwardRate>> = {
  air_india: {
    domestic_india: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 5000, premiumEconomy: 7500, business: 10000, first: 15000, tags: [{ text: 'Best for India', color: 'green' }], description: 'Air India Flying Returns — best value on domestic and regional Indian routes.' },
    south_asia: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 12000, premiumEconomy: 18000, business: 25000, first: 40000, tags: [{ text: 'Good Value', color: 'blue' }], description: 'Air India Flying Returns — solid value for South Asia and Middle East routes.' },
    middle_east_africa: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 20000, premiumEconomy: 30000, business: 45000, first: 70000, tags: [{ text: 'Good Value', color: 'blue' }], description: 'Air India Flying Returns for Middle East and Africa routes.' },
    europe: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 35000, premiumEconomy: 52000, business: 70000, first: 110000, tags: [{ text: 'Popular Route', color: 'blue' }], description: 'Air India Flying Returns — direct flights to London, Frankfurt, Paris.' },
    north_america: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 55000, premiumEconomy: 75000, business: 95000, first: 140000, tags: [{ text: 'Direct Flights', color: 'amber' }], description: 'Air India Flying Returns — nonstop DEL/BOM to JFK, SFO, ORD.' },
    australia_pacific: { program: 'Flying Returns', partner: 'Air India', ratio: '1:1', economy: 50000, premiumEconomy: 70000, business: 90000, first: 130000, tags: [], description: 'Air India Flying Returns for Australia and Pacific routes.' },
  },
  air_india_express: {
    domestic_india: { program: 'Flying Returns', partner: 'Air India Express', ratio: '1:1', economy: 4000, premiumEconomy: 4000, business: 4000, first: 4000, tags: [{ text: 'Budget Carrier', color: 'green' }], description: 'Air India Express — low-cost domestic and short-haul international.' },
    south_asia: { program: 'Flying Returns', partner: 'Air India Express', ratio: '1:1', economy: 9000, premiumEconomy: 9000, business: 9000, first: 9000, tags: [{ text: 'Budget Option', color: 'green' }], description: 'Air India Express — budget option to Gulf and South Asia.' },
    middle_east_africa: { program: 'Flying Returns', partner: 'Air India Express', ratio: '1:1', economy: 14000, premiumEconomy: 14000, business: 14000, first: 14000, tags: [], description: 'Air India Express for Middle East routes.' },
    europe: { program: 'Flying Returns', partner: 'Air India Express', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Not operated.' },
    north_america: { program: 'Flying Returns', partner: 'Air India Express', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Not operated.' },
    australia_pacific: { program: 'Flying Returns', partner: 'Air India Express', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Not operated.' },
  },
  emirates: {
    domestic_india: { program: 'Skywards', partner: 'Emirates', ratio: '1:1.5', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Emirates does not operate domestic Indian routes.' },
    south_asia: { program: 'Skywards', partner: 'Emirates', ratio: '1:1.5', economy: 15000, premiumEconomy: 22500, business: 42500, first: 62500, tags: [{ text: 'Premium Experience', color: 'amber' }], description: 'Emirates Skywards — award flights via Dubai hub.' },
    middle_east_africa: { program: 'Skywards', partner: 'Emirates', ratio: '1:1.5', economy: 17500, premiumEconomy: 25000, business: 50000, first: 75000, tags: [{ text: 'Hub: Dubai', color: 'blue' }], description: 'Emirates Skywards for Middle East and Africa via DXB.' },
    europe: { program: 'Skywards', partner: 'Emirates', ratio: '1:1.5', economy: 32500, premiumEconomy: 47500, business: 72500, first: 107500, tags: [{ text: 'Flat Bed Business', color: 'amber' }], description: 'Emirates Skywards — award to Europe via Dubai. Outstanding business class.' },
    north_america: { program: 'Skywards', partner: 'Emirates', ratio: '1:1.5', economy: 60000, premiumEconomy: 85000, business: 132500, first: 185000, tags: [{ text: 'First Class Suite', color: 'amber' }], description: 'Emirates Skywards to North America. First Class Suites are world-class.' },
    australia_pacific: { program: 'Skywards', partner: 'Emirates', ratio: '1:1.5', economy: 52500, premiumEconomy: 75000, business: 117500, first: 162500, tags: [], description: 'Emirates Skywards to Australia via Dubai.' },
  },
  british_airways: {
    domestic_india: { program: 'Avios', partner: 'British Airways', ratio: '1:1', economy: 7500, premiumEconomy: 0, business: 15000, first: 0, tags: [{ text: 'Distance Based', color: 'blue' }], description: 'BA Avios pricing is distance-based — great for short hops.' },
    south_asia: { program: 'Avios', partner: 'British Airways', ratio: '1:1', economy: 15000, premiumEconomy: 22500, business: 37500, first: 60000, tags: [{ text: 'Distance Based', color: 'blue' }], description: 'BA Avios — distance-based pricing benefits shorter routes.' },
    middle_east_africa: { program: 'Avios', partner: 'British Airways', ratio: '1:1', economy: 20000, premiumEconomy: 30000, business: 50000, first: 80000, tags: [], description: 'BA Avios for Middle East and Africa.' },
    europe: { program: 'Avios', partner: 'British Airways', ratio: '1:1', economy: 40000, premiumEconomy: 60000, business: 80000, first: 120000, tags: [{ text: 'via London', color: 'blue' }], description: 'BA Avios to Europe via London Heathrow.' },
    north_america: { program: 'Avios', partner: 'British Airways', ratio: '1:1', economy: 50000, premiumEconomy: 75000, business: 100000, first: 150000, tags: [{ text: 'Club Suite', color: 'amber' }], description: 'BA Avios to North America. New Club Suite on most 777/A350 routes.' },
    australia_pacific: { program: 'Avios', partner: 'British Airways', ratio: '1:1', economy: 60000, premiumEconomy: 90000, business: 120000, first: 180000, tags: [], description: 'BA Avios to Australia via London.' },
  },
  qatar: {
    domestic_india: { program: 'Privilege Club', partner: 'Qatar Airways', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Qatar does not operate domestic Indian routes.' },
    south_asia: { program: 'Privilege Club', partner: 'Qatar Airways', ratio: '1:1', economy: 12500, premiumEconomy: 20000, business: 35000, first: 0, tags: [{ text: 'Hub: Doha', color: 'blue' }], description: 'Qatar Privilege Club — award flights via DOH.' },
    middle_east_africa: { program: 'Privilege Club', partner: 'Qatar Airways', ratio: '1:1', economy: 15000, premiumEconomy: 25000, business: 40000, first: 0, tags: [], description: 'Qatar Privilege Club for Middle East and Africa.' },
    europe: { program: 'Privilege Club', partner: 'Qatar Airways', ratio: '1:1', economy: 32500, premiumEconomy: 50000, business: 70000, first: 0, tags: [{ text: 'Qsuite Business', color: 'amber' }], description: 'Qatar Privilege Club to Europe. QSuite is one of the best business class products.' },
    north_america: { program: 'Privilege Club', partner: 'Qatar Airways', ratio: '1:1', economy: 55000, premiumEconomy: 80000, business: 110000, first: 0, tags: [{ text: 'Qsuite Business', color: 'amber' }], description: 'Qatar Privilege Club to North America via Doha.' },
    australia_pacific: { program: 'Privilege Club', partner: 'Qatar Airways', ratio: '1:1', economy: 55000, premiumEconomy: 80000, business: 105000, first: 0, tags: [], description: 'Qatar Privilege Club to Australia via Doha.' },
  },
  united: {
    domestic_india: { program: 'MileagePlus', partner: 'United Airlines', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'United does not operate domestic Indian routes.' },
    south_asia: { program: 'MileagePlus', partner: 'United Airlines', ratio: '1:1', economy: 20000, premiumEconomy: 30000, business: 50000, first: 70000, tags: [], description: 'United MileagePlus for South Asia routes via partner airlines.' },
    middle_east_africa: { program: 'MileagePlus', partner: 'United Airlines', ratio: '1:1', economy: 30000, premiumEconomy: 45000, business: 70000, first: 100000, tags: [], description: 'United MileagePlus via Star Alliance partners.' },
    europe: { program: 'MileagePlus', partner: 'United Airlines', ratio: '1:1', economy: 30000, premiumEconomy: 45000, business: 70000, first: 110000, tags: [{ text: 'Star Alliance', color: 'blue' }], description: 'United MileagePlus — redeem on Lufthansa, Swiss, Air India and other Star Alliance partners.' },
    north_america: { program: 'MileagePlus', partner: 'United Airlines', ratio: '1:1', economy: 30000, premiumEconomy: 45000, business: 70000, first: 110000, tags: [{ text: 'Polaris Business', color: 'amber' }], description: 'United MileagePlus to North America. Polaris business class on long-haul.' },
    australia_pacific: { program: 'MileagePlus', partner: 'United Airlines', ratio: '1:1', economy: 40000, premiumEconomy: 60000, business: 80000, first: 120000, tags: [], description: 'United MileagePlus to Australia via Star Alliance.' },
  },
  qantas: {
    domestic_india: { program: 'Qantas FF', partner: 'Qantas', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Qantas does not operate domestic Indian routes.' },
    south_asia: { program: 'Qantas FF', partner: 'Qantas', ratio: '1:1', economy: 18000, premiumEconomy: 27000, business: 45000, first: 70000, tags: [], description: 'Qantas Frequent Flyer for South Asia via partner airlines.' },
    middle_east_africa: { program: 'Qantas FF', partner: 'Qantas', ratio: '1:1', economy: 25000, premiumEconomy: 37500, business: 55000, first: 90000, tags: [], description: 'Qantas FF for Middle East and Africa via oneworld partners.' },
    europe: { program: 'Qantas FF', partner: 'Qantas', ratio: '1:1', economy: 35000, premiumEconomy: 55000, business: 80000, first: 110000, tags: [{ text: 'oneworld', color: 'blue' }], description: 'Qantas FF to Europe via oneworld partners including BA and Qatar.' },
    north_america: { program: 'Qantas FF', partner: 'Qantas', ratio: '1:1', economy: 55000, premiumEconomy: 80000, business: 105000, first: 150000, tags: [], description: 'Qantas FF to North America via oneworld or Qantas metal.' },
    australia_pacific: { program: 'Qantas FF', partner: 'Qantas', ratio: '1:1', economy: 36000, premiumEconomy: 54000, business: 72000, first: 108000, tags: [{ text: 'Home Carrier', color: 'green' }], description: 'Qantas FF — best value to Australia on Qantas metal.' },
  },
  singapore_airlines: {
    domestic_india: { program: 'KrisFlyer', partner: 'Singapore Airlines', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'SQ does not operate domestic Indian routes.' },
    south_asia: { program: 'KrisFlyer', partner: 'Singapore Airlines', ratio: '1:1', economy: 15000, premiumEconomy: 22500, business: 35000, first: 50000, tags: [{ text: 'Hub: Singapore', color: 'blue' }], description: 'KrisFlyer — award flights via Singapore Changi.' },
    middle_east_africa: { program: 'KrisFlyer', partner: 'Singapore Airlines', ratio: '1:1', economy: 25000, premiumEconomy: 37500, business: 60000, first: 90000, tags: [], description: 'KrisFlyer for Middle East and Africa via SIN.' },
    europe: { program: 'KrisFlyer', partner: 'Singapore Airlines', ratio: '1:1', economy: 35000, premiumEconomy: 52500, business: 85000, first: 119000, tags: [{ text: 'Suite Class', color: 'amber' }], description: 'KrisFlyer to Europe. Singapore Suites on A380 routes is among the best in the world.' },
    north_america: { program: 'KrisFlyer', partner: 'Singapore Airlines', ratio: '1:1', economy: 62500, premiumEconomy: 90000, business: 114000, first: 152000, tags: [{ text: 'Suite Class', color: 'amber' }], description: 'KrisFlyer to North America via Singapore.' },
    australia_pacific: { program: 'KrisFlyer', partner: 'Singapore Airlines', ratio: '1:1', economy: 30000, premiumEconomy: 45000, business: 60000, first: 90000, tags: [{ text: 'Good Value', color: 'green' }], description: 'KrisFlyer to Australia — excellent value given SQ product quality.' },
  },
  lufthansa: {
    domestic_india: { program: 'Miles & More', partner: 'Lufthansa Group', ratio: '1:1', economy: 0, premiumEconomy: 0, business: 0, first: 0, tags: [], description: 'Lufthansa Group does not operate domestic Indian routes.' },
    south_asia: { program: 'Miles & More', partner: 'Lufthansa Group', ratio: '1:1', economy: 20000, premiumEconomy: 30000, business: 45000, first: 65000, tags: [], description: 'Miles & More for South Asia via Star Alliance partners.' },
    middle_east_africa: { program: 'Miles & More', partner: 'Lufthansa Group', ratio: '1:1', economy: 25000, premiumEconomy: 37500, business: 55000, first: 80000, tags: [], description: 'Miles & More for Middle East and Africa.' },
    europe: { program: 'Miles & More', partner: 'Lufthansa Group', ratio: '1:1', economy: 30000, premiumEconomy: 45000, business: 60000, first: 90000, tags: [{ text: 'Hub: Frankfurt/Munich', color: 'blue' }], description: 'Miles & More — redeem on LH, Swiss, Austrian and Star Alliance partners to Europe.' },
    north_america: { program: 'Miles & More', partner: 'Lufthansa Group', ratio: '1:1', economy: 50000, premiumEconomy: 70000, business: 90000, first: 130000, tags: [{ text: 'First Class', color: 'amber' }], description: 'Miles & More to North America. Lufthansa First Class terminal in Frankfurt is legendary.' },
    australia_pacific: { program: 'Miles & More', partner: 'Lufthansa Group', ratio: '1:1', economy: 55000, premiumEconomy: 80000, business: 100000, first: 145000, tags: [], description: 'Miles & More to Australia via Frankfurt.' },
  },
};