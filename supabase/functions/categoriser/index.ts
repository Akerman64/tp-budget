// Edge Function Supabase (Deno) — brique IA du projet Budget.
//
// Rôle : recevoir un libellé de dépense et renvoyer sa catégorie.
// La clé API Anthropic reste ici, côté serveur : elle ne doit jamais se
// trouver dans l'application mobile (le code d'une app est lisible).
//
// Déploiement :
//   supabase functions deploy categoriser --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Puis copier l'URL de la fonction dans config.js (IA_ENDPOINT).

import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const { libelle, categories } = await req.json();

    if (typeof libelle !== "string" || !libelle.trim()) {
      return json({ error: "Champ « libelle » manquant." }, 400);
    }

    const liste: string[] = Array.isArray(categories) && categories.length
      ? categories
      : ["courses", "transport", "logement", "sorties", "sante", "abonnements", "autre"];

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 256,
      // Classification simple : pas besoin de raisonnement étendu.
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        // Sortie structurée : la réponse est garantie conforme au schéma,
        // pas besoin de parser du texte libre.
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              categorie: { type: "string", enum: liste },
            },
            required: ["categorie"],
            additionalProperties: false,
          },
        },
      },
      system:
        "Tu classes des dépenses personnelles d'étudiants français. " +
        "À partir du libellé d'une dépense, choisis la catégorie la plus probable " +
        "parmi la liste fournie. En cas de doute, réponds « autre ».",
      messages: [
        {
          role: "user",
          content: `Catégories possibles : ${liste.join(", ")}\nLibellé : ${libelle}`,
        },
      ],
    });

    // Les classificateurs de sécurité peuvent refuser une requête : on vérifie
    // stop_reason avant de lire le contenu.
    if (response.stop_reason === "refusal") {
      return json({ categorie: "autre" });
    }

    const bloc = response.content.find((b) => b.type === "text");
    const categorie = bloc ? JSON.parse(bloc.text).categorie : "autre";

    return json({ categorie });
  } catch (e) {
    // L'application mobile retombe sur ses règles par mots-clés en cas d'erreur.
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
