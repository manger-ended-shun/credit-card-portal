import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
const groqApiKey = process.env.GROQ_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin')?.toUpperCase();
    const dest = searchParams.get('dest')?.toUpperCase();

    if (!origin || !dest) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // 1. Try fetching from Supabase first
    const { data: dbData } = await supabase
      .from('flight_routes')
      .select('*')
      .eq('origin', origin)
      .eq('dest', dest);

    if (dbData && dbData.length > 0) {
      return NextResponse.json({ success: true, source: 'db', data: dbData });
    }

    // 2. Fetch from Groq if not in DB
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "groq/compound",
        messages: [
          { role: "system", content: "You are a helpful travel assistant. Provide flight route data in JSON format." },
          { role: "user", content: `Find flight routes from ${origin} to ${dest}.` }
        ],
        temperature: 0.1
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      source: 'groq', 
      data: groqData.choices?.[0]?.message?.content 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}