export interface FlightDeal {
  id: string;
  origin: string;
  destination: string;
  airline: string;
  price: number;
  historical_avg: number;
  departure_date: string;
  source: 'Google Flights' | 'Skyscanner';
  deal_grade: 'A+' | 'A' | 'B+' | 'B';
  deal_url: string;
  created_at: string;
}