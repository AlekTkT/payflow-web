import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseUrl.startsWith('http'));

// Create a mock client if not configured to prevent errors
const createSupabaseClient = (): SupabaseClient<Database> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase credentials not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in the ENV tab.');
    // Return a placeholder URL to prevent crash - queries will fail gracefully
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = createSupabaseClient();

// Test connection on app start (with error handling)
if (isSupabaseConfigured) {
  (async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
      if (error) {
        console.log('[Supabase] Connection ERROR:', error.message);
      } else {
        console.log('[Supabase] Connection SUCCESS - Found', data?.length ?? 0, 'companies');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.log('[Supabase] Network error:', message);
    }
  })();
}
