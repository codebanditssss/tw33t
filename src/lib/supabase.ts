import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Create a single instance for the browser
let browserInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (browserInstance) return browserInstance;

  browserInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
      },
    }
  );

  return browserInstance;
}

// Create a single instance for server-side operations
let serverInstance: ReturnType<typeof createClient> | null = null;

export function getServerClient() {
  if (serverInstance) return serverInstance;

  serverInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return serverInstance;
}

// Helper to get the appropriate client based on environment
export function getSupabaseClient(isServer = false) {
  if (typeof window === 'undefined' || isServer) {
    return getServerClient();
  }
  return getBrowserClient();
} 