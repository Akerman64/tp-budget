import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export default function AuthScreen() {
  const [mode, setMode] = useState("connexion"); // "connexion" | "inscription"
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [info, setInfo] = useState(null);

  const inscription = mode === "inscription";

  async function valider() {
    setErreur(null);
    setInfo(null);
    setLoading(true);

    try {
      if (inscription) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: motDePasse,
        });
        if (error) throw error;
        setInfo("Compte créé. Vous pouvez maintenant vous connecter.");
        setMode("connexion");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: motDePasse,
        });
        if (error) throw error;
        // Pas de navigation ici : App.js écoute onAuthStateChange et
        // bascule automatiquement sur l'application.
      }
    } catch (e) {
      setErreur(traduire(e.message));
    } finally {
      setLoading(false);
    }
  }

  const valide = email.includes("@") && motDePasse.length >= 6;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.contenu}>
        <Text style={styles.logo}>Budget</Text>
        <Text style={styles.sousTitre}>Suivez vos dépenses du mois</Text>

        <TextInput
          style={styles.champ}
          placeholder="Adresse e-mail"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.champ}
          placeholder="Mot de passe (6 caractères min.)"
          placeholderTextColor={colors.muted}
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
        />

        {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}
        {!!info && <Text style={styles.info}>{info}</Text>}

        <Pressable
          style={[styles.bouton, (!valide || loading) && styles.boutonInactif]}
          onPress={valider}
          disabled={!valide || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.boutonTexte}>
              {inscription ? "Créer mon compte" : "Se connecter"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(inscription ? "connexion" : "inscription");
            setErreur(null);
            setInfo(null);
          }}
        >
          <Text style={styles.lien}>
            {inscription
              ? "J'ai déjà un compte — me connecter"
              : "Pas encore de compte ? S'inscrire"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function traduire(message = "") {
  if (message.includes("Invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (message.includes("already registered"))
    return "Cette adresse est déjà utilisée.";
  return message;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, justifyContent: "center" },
  contenu: { padding: 24, gap: 12 },
  logo: { fontSize: 34, fontWeight: "800", color: colors.text },
  sousTitre: { color: colors.muted, marginBottom: 16 },

  champ: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  erreur: { color: colors.rouge },
  info: { color: colors.vert },

  bouton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  boutonInactif: { opacity: 0.4 },
  boutonTexte: { color: "#fff", fontWeight: "700", fontSize: 16 },

  lien: { color: colors.primary, textAlign: "center", marginTop: 12 },
});
