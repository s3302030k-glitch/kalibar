import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage, // Explicitly use window.localStorage
    storageKey: 'sb-arasbaran-auth', // Shorter, simpler key
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // More secure flow
  },
  db: {
    schema: 'public',
  },
});

// Test storage on init
console.log('[SUPABASE] Storage test:', {
  canWrite: (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  })(),
  existingKeys: Object.keys(localStorage).filter(k => k.includes('sb-') || k.includes('arasbaran'))
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
};