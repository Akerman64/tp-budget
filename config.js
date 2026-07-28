// --- Supabase -------------------------------------------------------------
// Dashboard Supabase > Project Settings > API
// On ne met QUE la clé anon (publique) dans une app mobile.
export const SUPABASE_URL = "https://hprngycnukszfmmovtgl.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_UHEdehYuoqMA4auQWqTfjw_kHou2tyv";

// --- Brique IA (bonus) ----------------------------------------------------
// Catégorisation automatique d'une dépense à partir de son libellé.
// URL de l'Edge Function Supabase qui appelle l'API Claude côté serveur
// (la clé API ne doit JAMAIS se trouver dans l'app mobile).
// Laissez la chaîne vide pour désactiver l'IA : l'app bascule alors sur des
// règles par mots-clés, elle reste 100 % fonctionnelle.
export const IA_ENDPOINT = "";
