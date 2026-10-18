import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { getSupabaseConfig, hasSupabaseConfig } from './config.js';

const { url, anonKey } = getSupabaseConfig();

export const supabase = hasSupabaseConfig()
  ? createClient(url, anonKey)
  : null;

export const assertSupabaseReady = () => {
  if (!supabase) {
    console.warn('Supabase não configurado. Defina as chaves públicas no arquivo assets/js/config.js.');
    return false;
  }

  return true;
};
