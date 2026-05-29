import { createClient } from '@supabase/supabase-js';
 
// 🟢 FIX: Replaced the "!" with dummy fallbacks to bypass the Next.js build crash
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';
 
export const supabase = createClient(supabaseUrl, supabaseKey);
 
// 🟢 FIX: Applied the same dummy fallbacks to the Admin client
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-admin-key'
    )
  : null;