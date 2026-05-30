import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ success: false, error: "Missing DB Credentials" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // We only select the exact columns needed for the calculator to keep the API blazing fast
    const { data, error } = await supabase
      .from('cards')
      .select('id, card_name, transfer_partners, miles_conversion_ratio, base_reward_rate, annual_fee')
      .order('card_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching cards:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}