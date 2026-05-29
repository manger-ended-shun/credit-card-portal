// 🟢 Keep this to prevent build-time rendering
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
// 🟢 Import the perfectly working client we already fixed!
// (Update the path to '@/utils/supabase' if your file is in a utils folder)
import { supabase } from '@/lib/supabase'; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin')?.toUpperCase();
    const dest = searchParams.get('dest')?.toUpperCase();

    if (!origin || !dest) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // Directly query the Supabase database using the imported client
    const { data: dbData, error } = await supabase
      .from('flight_routes')
      .select('*')
      .eq('origin', origin)
      .eq('dest', dest);

    // Debugging log: Prints in your terminal
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