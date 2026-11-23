// Supabase-Client und kleine Helfer
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const isConfigured =
  SUPABASE_URL.startsWith('https://') && !SUPABASE_KEY.startsWith('HIER_');

export const sb = isConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

// RPC-Aufruf: wirft einen Error mit lesbarer deutscher Meldung
export async function rpc(name, args = {}) {
  const { data, error } = await sb.rpc(name, args);
  if (error) {
    const err = new Error(error.message || 'Unbekannter Fehler');
    err.code = error.code;
    throw err;
  }
  return data;
}

// Aktuellen Spielzustand + Motto lesen (öffentlich erlaubt)
export async function fetchGameState() {
  const { data: gs, error } = await sb.from('game_state').select('*').eq('id', 1).single();
  if (error) throw error;
  const { data: round } = await sb
    .from('rounds').select('motto').eq('id', gs.current_round_id).single();
  return { ...gs, motto: round?.motto ?? '' };
}

// Realtime-Abo auf game_state. onChange bekommt bei jeder Änderung Bescheid,
// onStatus meldet den Verbindungszustand (SUBSCRIBED, CLOSED, ...).
export function subscribeGameState(onChange, onStatus) {
  const ch = sb
    .channel('game_state_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, onChange)
    .subscribe((status) => onStatus && onStatus(status));
  return ch;
}
