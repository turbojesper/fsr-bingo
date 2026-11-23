// Konfiguration. Diese Werte dürfen öffentlich sein (Schutz übernimmt RLS in der Datenbank).
// NIE den service_role / Secret-Key hier eintragen.
//
// Werte findest du in Supabase unter: Project Settings > API
export const SUPABASE_URL = 'HIER_PROJEKT_URL_EINTRAGEN';   // z. B. https://abcdxyz.supabase.co
export const SUPABASE_KEY = 'HIER_PUBLISHABLE_KEY_EINTRAGEN'; // "anon" oder "publishable" Key

export const DEFAULT_THEME = 'weihnachten';
export const DEFAULT_POLL_MS = 4000;
