import { logger } from "@/utils/logger";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These variables should be defined in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are real (not placeholders)
const isValidUrl = supabaseUrl && 
                   supabaseUrl.startsWith('http') && 
                   !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL');
const isValidKey = supabaseAnonKey && 
                   supabaseAnonKey.length > 20 && 
                   !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY');


if (!isValidUrl || !isValidKey) {
  logger.warn(
    '⚠️ Supabase credentials are missing or still have placeholder values. Supabase features are disabled.'
  );
}

/**
 * Supabase Client Initialization
 * 
 * Used for client-side interactions with your database and auth.
 * Features:
 * - Real-time subscriptions enabled
 * - Strong typing support (if generated)
 * - Automatic session management
 * 
 * IMPORTANT: When Supabase is not configured, a real client is NOT created.
 * Instead, a safe no-op proxy is returned that prevents 503 crashes from
 * placeholder URLs. Always check `isSupabaseConfigured` before using.
 */

export const isSupabaseConfigured = isValidUrl && isValidKey;

let supabaseInstance: SupabaseClient;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
  }
}

// If Supabase is not configured or failed to initialize, create a safe no-op proxy
if (!supabaseInstance!) {
  const noOpResult = { data: null, error: null, count: null, status: 200, statusText: 'OK' };
  const noOpPromise = Promise.resolve(noOpResult);
  
  const createQueryProxy = (): any => {
    const proxy: any = {
      then: (resolve: any) => noOpPromise.then(resolve),
      catch: (reject: any) => noOpPromise.catch(reject),
      finally: (cb: any) => noOpPromise.finally(cb),
    };
    
    const handler = {
      get: (target: any, prop: string) => {
        if (prop in target) return target[prop];
        return (...args: any[]) => createQueryProxy();
      }
    };
    
    return new Proxy(proxy, handler);
  };

  // Improved Channel Proxy to support chaining .on().on().subscribe()
  const createChannelProxy = (): any => {
    const channelProxy: any = {
      on: () => channelProxy, // Return itself for chaining
      subscribe: () => channelProxy,
      unsubscribe: () => {},
    };
    return channelProxy;
  };

  supabaseInstance = new Proxy({} as any, {
    get: (_target, prop: string) => {
      if (prop === 'from') return (_table: string) => createQueryProxy();
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
          signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
        };
      }
      if (prop === 'storage') {
        return {
          from: () => ({
            upload: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            download: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            remove: async () => ({ data: null, error: null }),
            list: async () => ({ data: [], error: null }),
          }),
        };
      }
      if (prop === 'channel') return () => createChannelProxy();
      if (prop === 'removeChannel') return () => {};
      return (...args: any[]) => createQueryProxy();
    }
  }) as SupabaseClient;
}

export const supabase = supabaseInstance;

// Helper types for your schema
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  avatar_url?: string;
  is_online: boolean;
};

export type Service = {
  id: string;
  name_en: string;
  name_ur: string;
  base_price: number;
  is_active: boolean;
};
