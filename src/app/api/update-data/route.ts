import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ADD THIS LINE TO PREVENT CACHING
export const dynamic = 'force-dynamic';

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

    // Directly query the Supabase database
    const { data: dbData, error } = await supabase
      .from('flight_routes')
      .select('*')
      .eq('origin', origin)
      .eq('dest', dest);

    // Debugging log: This will print directly in your VS Code / GitHub Codespaces terminal
    console.log(`[API Debug] Searched ${origin} to ${dest}. Found ${dbData?.length || 0} results. Error:`, error?.message || 'None');

    if (error) {
      throw new Error(error.message);
    }

    // Return the payload to the frontend
    return NextResponse.json({ 
      success: true, 
      source: 'db', 
      data: dbData || [] 
    });

  } catch (error: any) {
    console.error("[API Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}