export interface Card {
  id: string;
  bank_name: string;
  card_name: string;
  card_type: string;
  card_network: string | null;
  card_tier: string | null;
  annual_fee: number;
  joining_fee: number;
  annual_fee_waiver_conditions: string | null;
  interest_rate: number | null;
  late_payment_fee: number | null;
  forex_markup: number | null;
  reward_type: string | null;
  reward_program_name: string | null;
  base_reward_rate: number | null;
  base_reward_unit: string | null;
  category_rewards: Record<string, number>;
  point_value_paise: number | null;
  welcome_bonus_points: number | null;
  welcome_bonus_miles: number | null;
  welcome_bonus_cashback: number | null;
  welcome_spend_requirement: number | null;
  domestic_lounge_access: number;
  international_lounge_access: number;
  lounge_program: string | null;
  fuel_surcharge_waiver: boolean;
  air_accident_insurance: number | null;
  travel_insurance: number | null;
  concierge_service: boolean;
  golf_access: number;
  min_income_monthly: number | null;
  min_credit_score: number;
  image_url: string | null;
  apply_link: string | null;
  is_active: boolean;
  is_popular: boolean;
  last_updated: string;
  created_at: string;
}
 
export interface Offer {
  id: string;
  title: string;
  description: string | null;
  offer_type: string;
  card_id: string | null;
  bank_name: string | null;
  offer_value: string | null;
  categories: string[] | null;
  merchants: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  source_name: string | null;
  source_url: string | null;
  source_type: string | null;
  view_count: number;
  click_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  card_name?: string;
  card_bank?: string;
}
 
export interface SearchLog {
  id: string;
  query: string;
  query_normalized: string | null;
  filters: Record<string, any>;
  cards_viewed: string[] | null;
  cards_compared: string[] | null;
  results_count: number | null;
  session_id: string | null;
  created_at: string;
}
 
export interface Bank {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cards_count: number;
}