export const colors = {
  bg: "#0E1116",
  card: "#181D26",
  cardHaut: "#212936",
  text: "#F3F5F9",
  muted: "#98A2B3",
  primary: "#5B8CFF",
  vert: "#34D399",
  rouge: "#F87171",
  border: "#2A3240",
};

export const CATEGORIES = [
  { cle: "courses", label: "Courses", emoji: "🛒" },
  { cle: "transport", label: "Transport", emoji: "🚇" },
  { cle: "logement", label: "Logement", emoji: "🏠" },
  { cle: "sorties", label: "Sorties", emoji: "🍻" },
  { cle: "sante", label: "Santé", emoji: "💊" },
  { cle: "abonnements", label: "Abonnements", emoji: "📺" },
  { cle: "autre", label: "Autre", emoji: "📦" },
];

export function categorie(cle) {
  return CATEGORIES.find((c) => c.cle === cle) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function euros(montant) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(montant) || 0);
}
