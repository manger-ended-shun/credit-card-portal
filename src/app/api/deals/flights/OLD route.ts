import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const source = searchParams.get('source');

    let query = supabase
      .from('flight_deals')
      .select('*')
      .order('price', { ascending: true })
      .limit(50); // Keep the dashboard snappy

    if (origin && origin !== 'All') {
      query = query.eq('origin', origin);
    }
    
    if (source && source !== 'All') {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, deals: data });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flight deals' },
      { status: 500 }
    );
  }
}