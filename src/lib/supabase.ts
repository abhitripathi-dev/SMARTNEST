import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-url')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Subscribe to real-time changes across all society tables
 */
export function subscribeToRealtimeChanges(
  societyId: string,
  onUpdate: (table: string, payload: any) => void
) {
  if (!supabase || !isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`society-realtime-${societyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
      },
      (payload) => {
        onUpdate(payload.table, payload);
        window.dispatchEvent(new Event('society-data-change'));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
