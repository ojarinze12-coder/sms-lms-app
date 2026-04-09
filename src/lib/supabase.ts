import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'https://placeholder.supabase.co';
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
};

const getSupabaseAnonKey = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'placeholder-key';
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

const supabaseUrl = getSupabaseUrl();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});