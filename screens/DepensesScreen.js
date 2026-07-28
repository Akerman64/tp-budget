import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { categorie, colors, euros } from "../theme";

// Premier jour du mois en cours, au format ISO (filtre côté base).
function debutDuMois() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export default function DepensesScreen({ navigation, session }) {
  const [depenses, setDepenses] = useState([]);
  const [objectif, setObjectif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const charger = useCallback(async () => {
    setError(null);
    try {
      // Les politiques RLS limitent déjà chaque utilisateur à ses propres lignes.
      const [{ data: lignes, error: e1 }, { data: profil, error: e2 }] =
        await Promise.all([
          supabase
            .from("depenses")
            .select("*")
            .gte("date_depense", debutDuMois())
            .order("date_depense", { ascending: false }),
          supabase
            .from("profils")
            .select("objectif_epargne")
            .eq("id", session.user.id)
            .maybeSingle(),
        ]);

      if (e1) throw e1;
      if (e2) throw e2;

      setDepenses(lignes ?? []);
      setObjectif(profil?.objectif_epargne ?? null);
    } catch (e) {
      setError(e.message ?? "Impossible de charger vos dépenses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.user.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Recharge au retour des écrans Détail / Ajout.
  useEffect(() => navigation.addListener("focus", charger), [navigation, charger]);

  const total = useMemo(
    () => depenses.reduce((somme, d) => somme + Number(d.montant), 0),
    [depenses]
  );

  // Répartition par catégorie, de la plus grosse à la plus petite.
  const repartition = useMemo(() => {
    const parCle = {};
    for (const d of depenses) {
      parCle[d.categorie] = (parCle[d.categorie] ?? 0) + Number(d.montant);
    }
    return Object.entries(parCle)
      .map(([cle, montant]) => ({ cle, montant }))
      .sort((a, b) => b.montant - a.montant);
  }, [depenses]);

  if (loading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Chargement…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centre}>
        <Text style={styles.erreur}>{error}</Text>
        <Pressable
          style={styles.bouton}
          onPress={() => {
            setLoading(true);
            charger();
          }}
        >
          <Text style={styles.boutonTexte}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  const budget = objectif ? Number(objectif) : null;
  const depassement = budget !== null && total > budget;

  return (
    <View style={styles.page}>
      <FlatList
        data={depenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.liste}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              charger();
            }}
            tintColor={colors.muted}
          />
        }
        ListHeaderComponent={
          <View style={styles.entete}>
            <Text style={styles.enteteLabel}>Dépensé ce mois-ci</Text>
            <Text style={styles.enteteTotal}>{euros(total)}</Text>

            {budget !== null && (
              <>
                <View style={styles.jauge}>
                  <View
                    style={[
                      styles.jaugeRemplie,
                      {
                        width: `${Math.min(100, (total / budget) * 100)}%`,
                        backgroundColor: depassement ? colors.rouge : colors.vert,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.enteteObjectif, depassement && styles.enteteAlerte]}
                >
                  {depassement
                    ? `Objectif dépassé de ${euros(total - budget)}`
                    : `Il reste ${euros(budget - total)} sur ${euros(budget)}`}
                </Text>
              </>
            )}

            {repartition.length > 0 && (
              <View style={styles.repartition}>
                {repartition.slice(0, 4).map(({ cle, montant }) => {
                  const c = categorie(cle);
                  return (
                    <View key={cle} style={styles.puce}>
                      <Text style={styles.puceTexte}>
                        {c.emoji} {c.label} · {euros(montant)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTitre}>Aucune dépense ce mois-ci</Text>
            <Text style={styles.muted}>
              Appuyez sur « + » pour enregistrer la première.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const c = categorie(item.categorie);
          return (
            <Pressable
              style={styles.ligne}
              onPress={() => navigation.navigate("Detail", { id: item.id })}
            >
              <Text style={styles.emoji}>{c.emoji}</Text>
              <View style={styles.ligneTexte}>
                <Text style={styles.libelle} numberOfLines={1}>
                  {item.libelle}
                </Text>
                <Text style={styles.sousLigne}>
                  {c.label} ·{" "}
                  {new Date(item.date_depense).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </Text>
              </View>
              <Text style={styles.montant}>{euros(item.montant)}</Text>
            </Pressable>
          );
        }}
      />

      <Pressable
        style={styles.flottant}
        onPress={() => navigation.navigate("Ajout")}
      >
        <Text style={styles.flottantTexte}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  centre: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  muted: { color: colors.muted, textAlign: "center" },
  erreur: { color: colors.rouge, textAlign: "center" },

  liste: { padding: 16, gap: 8, paddingBottom: 96, flexGrow: 1 },

  entete: {
    backgroundColor: colors.cardHaut,
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
  },
  enteteLabel: { color: colors.muted, fontSize: 13 },
  enteteTotal: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
    marginTop: 4,
  },
  jauge: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginTop: 16,
    overflow: "hidden",
  },
  jaugeRemplie: { height: 8, borderRadius: 4 },
  enteteObjectif: { color: colors.vert, marginTop: 8, fontWeight: "600" },
  enteteAlerte: { color: colors.rouge },

  repartition: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  puce: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  puceTexte: { color: colors.muted, fontSize: 12 },

  ligne: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  emoji: { fontSize: 22 },
  ligneTexte: { flex: 1 },
  libelle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  sousLigne: { color: colors.muted, fontSize: 12, marginTop: 2 },
  montant: { color: colors.text, fontSize: 16, fontWeight: "700" },

  vide: { alignItems: "center", gap: 6, paddingVertical: 48 },
  videTitre: { color: colors.text, fontSize: 16, fontWeight: "600" },

  bouton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  boutonTexte: { color: "#fff", fontWeight: "600" },

  flottant: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  flottantTexte: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "300" },
});
