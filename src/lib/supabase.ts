import { createClient } from '@supabase/supabase-js';

// Initializes the core React Supabase Client for usage in our Frontend UIs.
// Ensure you have defined these in your local environment payload (.env)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl && process.env.NODE_ENV !== 'production') {
    console.warn('[NEXUS_OS] WARNING: VITE_SUPABASE_URL is missing. Operating on local offline parameters.');
}

export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
