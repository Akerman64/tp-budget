import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export default function ProfilScreen({ navigation, session }) {
  const [objectif, setObjectif] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let annule = false;

    (async () => {
      const { data } = await supabase
        .from("profils")
        .select("objectif_epargne")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!annule) {
        if (data?.objectif_epargne != null) setObjectif(String(data.objectif_epargne));
        setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [session.user.id]);

  async function enregistrer() {
    const valeur = Number(objectif.replace(",", "."));
    setSaving(true);
    try {
      // upsert : crée la ligne de profil si elle n'existe pas encore.
      const { error } = await supabase.from("profils").upsert({
        id: session.user.id,
        objectif_epargne: Number.isFinite(valeur) && valeur > 0 ? valeur : null,
      });
      if (error) throw error;
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", e.message ?? "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.email}>{session.user.email}</Text>

      <Text style={styles.label}>Budget mensuel (€)</Text>
      <TextInput
        style={styles.champ}
        placeholder="Ex : 600"
        placeholderTextColor={colors.muted}
        value={objectif}
        onChangeText={setObjectif}
        keyboardType="decimal-pad"
      />
      <Text style={styles.aide}>
        Laissez vide pour ne pas afficher d'objectif sur l'écran d'accueil.
      </Text>

      <Pressable
        style={[styles.bouton, saving && styles.boutonInactif]}
        onPress={enregistrer}
        disabled={saving}
      >
        <Text style={styles.boutonTexte}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.deconnexion}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.deconnexionTexte}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  contenu: { padding: 16, gap: 8 },
  centre: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  email: { color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 8 },
  label: { color: colors.muted, fontSize: 13, marginTop: 8 },
  champ: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  aide: { color: colors.muted, fontSize: 12 },

  bouton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  boutonInactif: { opacity: 0.5 },
  boutonTexte: { color: "#fff", fontWeight: "700", fontSize: 16 },

  deconnexion: { paddingVertical: 16, alignItems: "center" },
  deconnexionTexte: { color: colors.rouge, fontWeight: "600" },
});
