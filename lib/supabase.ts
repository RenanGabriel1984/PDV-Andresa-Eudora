import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Ensure the URL is valid to prevent app crashes on reload
try {
  new URL(supabaseUrl);
} catch (e) {
  console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL provided. Using placeholder.');
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
