import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the standard public URL, but securely use the backend service key (or anon key fallback)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin')?.toUpperCase();
    const dest = searchParams.get('dest')?.toUpperCase();

    if (!origin || !dest) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // Directly query the Supabase database populated by our GitHub Action scraper
    const { data: dbData, error } = await supabase
      .from('flight_routes')
      .select('*')
      .eq('origin', origin)
      .eq('dest', dest);

    if (error) {
      throw new Error(error.message);
    }

    // Return the payload directly to the frontend
    return NextResponse.json({ 
      success: true, 
      source: 'db', 
      data: dbData || [] 
    });

  } catch (error: any) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}