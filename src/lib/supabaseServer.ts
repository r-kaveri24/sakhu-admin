import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client using a dedicated read-only key if provided,
// otherwise falls back to the service role key. No session persistence.

export function createServerSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Prefer production keepalive key; fall back to read-only or service role
  const supabaseKey =
    process.env.SUPABASE_KEEPALIVE_KEY ||
    process.env.SUPABASE_READONLY_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}