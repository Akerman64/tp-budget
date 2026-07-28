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
import { CATEGORIES, categorie, colors, euros } from "../theme";

export default function DetailScreen({ route, navigation }) {
  // Paramètre transmis par l'écran Liste
  const { id } = route.params;

  const [depense, setDepense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [cle, setCle] = useState("autre");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let annule = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("depenses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (annule) return;

        setDepense(data);
        setLibelle(data.libelle);
        setMontant(String(data.montant));
        setCle(data.categorie);
      } catch (e) {
        if (!annule) setError(e.message ?? "Dépense introuvable.");
      } finally {
        if (!annule) setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [id]);

  async function enregistrer() {
    const valeur = Number(montant.replace(",", "."));
    if (!libelle.trim() || !Number.isFinite(valeur) || valeur <= 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("depenses")
        .update({ libelle: libelle.trim(), montant: valeur, categorie: cle })
        .eq("id", id);

      if (error) throw error;
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", e.message ?? "Modification impossible.");
    } finally {
      setSaving(false);
    }
  }

  function confirmerSuppression() {
    Alert.alert("Supprimer cette dépense ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("depenses").delete().eq("id", id);
          if (error) Alert.alert("Erreur", error.message);
          else navigation.goBack();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !depense) {
    return (
      <View style={styles.centre}>
        <Text style={styles.erreur}>{error ?? "Dépense introuvable."}</Text>
      </View>
    );
  }

  const c = categorie(depense.categorie);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <View style={styles.resume}>
        <Text style={styles.resumeEmoji}>{c.emoji}</Text>
        <Text style={styles.resumeMontant}>{euros(depense.montant)}</Text>
        <Text style={styles.resumeDate}>
          {new Date(depense.date_depense).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      <Text style={styles.label}>Libellé</Text>
      <TextInput style={styles.champ} value={libelle} onChangeText={setLibelle} />

      <Text style={styles.label}>Montant (€)</Text>
      <TextInput
        style={styles.champ}
        value={montant}
        onChangeText={setMontant}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.grille}>
        {CATEGORIES.map((cat) => {
          const actif = cat.cle === cle;
          return (
            <Pressable
              key={cat.cle}
              style={[styles.tuile, actif && styles.tuileActive]}
              onPress={() => setCle(cat.cle)}
            >
              <Text style={styles.tuileEmoji}>{cat.emoji}</Text>
              <Text style={[styles.tuileTexte, actif && styles.tuileTexteActif]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.bouton, saving && styles.boutonInactif]}
        onPress={enregistrer}
        disabled={saving}
      >
        <Text style={styles.boutonTexte}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Text>
      </Pressable>

      <Pressable style={styles.boutonSupprimer} onPress={confirmerSuppression}>
        <Text style={styles.boutonSupprimerTexte}>Supprimer la dépense</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  contenu: { padding: 16, gap: 8, paddingBottom: 40 },
  centre: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  erreur: { color: colors.rouge, textAlign: "center" },

  resume: {
    backgroundColor: colors.cardHaut,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  resumeEmoji: { fontSize: 34 },
  resumeMontant: { color: colors.text, fontSize: 32, fontWeight: "800" },
  resumeDate: { color: colors.muted, textTransform: "capitalize" },

  label: { color: colors.muted, fontSize: 13, marginTop: 12 },
  champ: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },

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
  boutonInactif: { opacity: 0.5 },
  boutonTexte: { color: "#fff", fontWeight: "700", fontSize: 16 },

  boutonSupprimer: { paddingVertical: 16, alignItems: "center" },
  boutonSupprimerTexte: { color: colors.rouge, fontWeight: "600" },
});
