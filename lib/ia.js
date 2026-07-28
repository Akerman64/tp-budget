import { IA_ENDPOINT } from "../config";
import { CATEGORIES } from "../theme";

// Repli hors-ligne : quelques mots-clés suffisent quand l'IA est indisponible.
const MOTS_CLES = {
  courses: ["carrefour", "lidl", "auchan", "leclerc", "monoprix", "course", "supermarch", "boulang", "march"],
  transport: ["navigo", "metro", "métro", "uber", "essence", "sncf", "train", "bus", "velib", "carburant"],
  logement: ["loyer", "edf", "electricit", "électricit", "gaz", "internet", "box", "assurance habitation", "charges"],
  sorties: ["bar", "resto", "restaurant", "cinema", "cinéma", "biere", "bière", "concert", "kebab", "mcdo", "pizza"],
  sante: ["pharmacie", "medecin", "médecin", "mutuelle", "dentiste", "opticien"],
  abonnements: ["netflix", "spotify", "abonnement", "forfait", "salle de sport", "basic fit", "canal", "prime"],
};

function categoriserParMotsCles(libelle) {
  const texte = libelle.toLowerCase();
  for (const [cle, mots] of Object.entries(MOTS_CLES)) {
    if (mots.some((m) => texte.includes(m))) return cle;
  }
  return "autre";
}

/**
 * Brique IA (bonus) : devine la catégorie d'une dépense à partir de son libellé.
 * L'appel passe par une Edge Function Supabase qui détient la clé API — la clé
 * ne transite jamais par l'application mobile.
 * En cas d'erreur (réseau, endpoint non configuré) on retombe sur les mots-clés :
 * la fonctionnalité se dégrade, elle ne casse jamais le parcours.
 */
export async function categoriserDepense(libelle) {
  if (!libelle?.trim()) return "autre";
  if (!IA_ENDPOINT) return categoriserParMotsCles(libelle);

  try {
    const reponse = await fetch(IA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        libelle,
        categories: CATEGORIES.map((c) => c.cle),
      }),
    });

    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);

    const data = await reponse.json();
    const cle = String(data.categorie ?? "").toLowerCase();

    return CATEGORIES.some((c) => c.cle === cle) ? cle : categoriserParMotsCles(libelle);
  } catch {
    return categoriserParMotsCles(libelle);
  }
}
