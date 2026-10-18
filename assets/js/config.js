const appConfig = {
  // Valores públicos do Supabase — apenas o URL e a chave "publishable/anon" devem
  // ficar no front-end. NÃO coloque a `SUPABASE_SECRET_KEY` neste arquivo.
  supabaseUrl: 'HTTP://URLSUPABASE.CO',
  supabaseAnonKey: 'CHAVE PUBLICA ANONIMA DO SUPABASE',
  isDevMode: true,
};

export const config = appConfig;

export const getSupabaseConfig = () => ({
  url: appConfig.supabaseUrl,
  anonKey: appConfig.supabaseAnonKey,
});

export const hasSupabaseConfig = () =>
  appConfig.supabaseUrl && appConfig.supabaseUrl !== 'HTTP://URLSUPABASE.CO' &&
  appConfig.supabaseAnonKey && appConfig.supabaseAnonKey !== 'CHAVE PUBLICA ANONIMA DO SUPABASE';
