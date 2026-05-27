// src/utils/track-activity.ts
import { supabase } from '@/lib/supabase';

export async function logActivity(actionName: string) {
  try {
    const { data, error } = await supabase.from('search_logs').insert([
      {
        query: actionName,
        query_normalized: actionName.toLowerCase().trim(),
        results_count: 1,
      },
    ]);

    if (error) {
      console.error('Supabase Tracking Error:', error.message); // This will show you exactly what's wrong
    } else {
      console.log('Activity tracked successfully:', actionName);
    }
  } catch (err) {
    console.error('Unexpected Tracking Error:', err);
  }
}