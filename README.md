# TP de groupe — Budget (projet n°8)

Suivi des dépenses du mois : ajouter une dépense (montant + catégorie), voir le
total, se fixer un objectif d'épargne, visualiser la répartition.

## Ce que couvre le projet (barème sur 20)

| Critère du sujet | Où c'est réalisé |
|---|---|
| Application fonctionnelle, parcours complet | Inscription → connexion → liste → ajout → détail → modification / suppression |
| Base de données + CRUD | Supabase, table `depenses` : `select` / `insert` / `update` / `delete` |
| Authentification | Supabase Auth (`signUp`, `signInWithPassword`, `signOut`), session persistée avec AsyncStorage |
| Navigation & interface soignée | React Navigation (stack), thème sombre, 3 états gérés (chargement / erreur / vide) |
| Déploiement | EAS Build (voir plus bas) |
| Bonus — brique IA | Catégorisation automatique d'une dépense à partir de son libellé (Edge Function + API Claude) |
| Bonus — divers | Thème sombre, pull-to-refresh, jauge d'objectif, répartition par catégorie |

## Mise en route

### 1. Base de données

Créer un projet sur [supabase.com](https://supabase.com), puis exécuter
`supabase.sql` dans **SQL Editor**. Le script crée les tables `depenses` et
`profils` et active les politiques RLS (chaque utilisateur ne voit que ses
propres lignes).

Dans **Authentication > Providers > Email**, désactiver « Confirm email » pour
pouvoir tester sans boîte mail.

### 2. Configuration de l'app

Renseigner l'URL et la clé **anon** du projet dans `config.js`
(*Project Settings > API*). Ne jamais mettre la clé « service » dans l'app :
le code d'une application mobile est lisible.

### 3. Lancer

```bash
npm install
npx expo start
```

### 4. Brique IA (facultatif)

Sans configuration, la catégorisation fonctionne déjà avec des règles par
mots-clés. Pour la version IA :

```bash
supabase functions deploy categoriser --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Puis coller l'URL de la fonction dans `IA_ENDPOINT` (`config.js`). La clé API
reste côté serveur ; l'app n'appelle que l'Edge Function.

## Déploiement (APK / piste Test interne)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # produit un .apk installable
```

Pour la piste Test interne de la Play Console, utiliser un profil `production`
(le build produit alors un `.aab` à déposer sur la console).

## Structure

```
App.js                 navigation + gestion de la session
config.js              URL / clé Supabase, endpoint IA
theme.js               couleurs, catégories, format des montants
lib/supabase.js        client Supabase (session persistée)
lib/ia.js              catégorisation auto (IA + repli mots-clés)
screens/AuthScreen     inscription / connexion
screens/DepensesScreen liste + total + objectif + répartition
screens/AjoutScreen    formulaire d'ajout (catégorie suggérée)
screens/DetailScreen   détail, modification, suppression
screens/ProfilScreen   objectif mensuel, déconnexion
supabase/functions/categoriser/  Edge Function (API Claude)
supabase.sql           schéma + politiques RLS
```

## Répartition du travail (à adapter par le groupe)

Chaque membre doit pouvoir expliquer sa partie à la soutenance :

- **Membre 1** — base de données, RLS, authentification (`supabase.sql`, `AuthScreen`, `lib/supabase.js`)
- **Membre 2** — liste, total, objectif, navigation (`DepensesScreen`, `App.js`, `ProfilScreen`)
- **Membre 3** — ajout / détail / CRUD, brique IA, déploiement EAS (`AjoutScreen`, `DetailScreen`, `lib/ia.js`, Edge Function)
