import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // La session est stockée sur le téléphone : l'utilisateur reste connecté
    // entre deux lancements de l'app.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Pas de redirection d'URL sur mobile.
    detectSessionInUrl: false,
  },
});
