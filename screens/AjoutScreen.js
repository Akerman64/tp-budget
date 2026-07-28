import { useState } from "react";
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
import { categoriserDepense } from "../lib/ia";
import { CATEGORIES, colors } from "../theme";

export default function AjoutScreen({ navigation, session }) {
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [cle, setCle] = useState("autre");
  const [suggestion, setSuggestion] = useState(false); // catégorie proposée par l'IA
  const [analyse, setAnalyse] = useState(false);
  const [saving, setSaving] = useState(false);

  // Brique IA : quand l'utilisateur quitte le champ libellé, on demande une
  // catégorie. L'utilisateur reste libre de la changer.
  async function suggererCategorie() {
    if (!libelle.trim()) return;
    setAnalyse(true);
    try {
      const proposee = await categoriserDepense(libelle);
      setCle(proposee);
      setSuggestion(true);
    } finally {
      setAnalyse(false);
    }
  }

  async function enregistrer() {
    const valeur = Number(montant.replace(",", "."));
    if (!libelle.trim() || !Number.isFinite(valeur) || valeur <= 0) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("depenses").insert({
        user_id: session.user.id,
        libelle: libelle.trim(),
        montant: valeur,
        categorie: cle,
      });
      if (error) throw error;
      navigation.goBack(); // la liste se recharge à son retour au premier plan
    } catch (e) {
      Alert.alert("Erreur", e.message ?? "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  const valide =
    libelle.trim() && Number(montant.replace(",", ".")) > 0 && !saving;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.label}>Libellé</Text>
      <TextInput
        style={styles.champ}
        placeholder="Ex : courses Lidl, Navigo, kebab…"
        placeholderTextColor={colors.muted}
        value={libelle}
        onChangeText={(t) => {
          setLibelle(t);
          setSuggestion(false);
        }}
        onBlur={suggererCategorie}
      />

      <Text style={styles.label}>Montant (€)</Text>
      <TextInput
        style={styles.champ}
        placeholder="0,00"
        placeholderTextColor={colors.muted}
        value={montant}
        onChangeText={setMontant}
        keyboardType="decimal-pad"
      />

      <View style={styles.enteteCategorie}>
        <Text style={styles.label}>Catégorie</Text>
        {analyse && <ActivityIndicator size="small" color={colors.primary} />}
        {suggestion && !analyse && (
          <Text style={styles.badgeIA}>suggérée automatiquement</Text>
        )}
      </View>

      <View style={styles.grille}>
        {CATEGORIES.map((c) => {
          const actif = c.cle === cle;
          return (
            <Pressable
              key={c.cle}
              style={[styles.tuile, actif && styles.tuileActive]}
              onPress={() => {
                setCle(c.cle);
                setSuggestion(false);
              }}
            >
              <Text style={styles.tuileEmoji}>{c.emoji}</Text>
              <Text style={[styles.tuileTexte, actif && styles.tuileTexteActif]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.bouton, !valide && styles.boutonInactif]}
        onPress={enregistrer}
        disabled={!valide}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.boutonTexte}>Enregistrer la dépense</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  contenu: { padding: 16, gap: 8, paddingBottom: 40 },

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

  enteteCategorie: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeIA: { color: colors.primary, fontSize: 12, marginTop: 8 },

  grille: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tuile: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tuileActive: { borderColor: colors.primary, backgroundColor: colors.cardHaut },
  tuileEmoji: { fontSize: 16 },
  tuileTexte: { color: colors.muted },
  tuileTexteActif: { color: colors.text, fontWeight: "600" },

  bouton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  boutonInactif: { opacity: 0.4 },
  boutonTexte: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
