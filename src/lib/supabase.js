import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && anonKey);

// Without the two .env values the page must still open (createClient throws on an empty url): the form then
// reports the problem when it is submitted.
export const supabase = supabaseReady ? createClient(url, anonKey) : null;
