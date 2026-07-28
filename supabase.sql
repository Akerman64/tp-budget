-- À exécuter dans Supabase > SQL Editor

-- 1. Table des dépenses ------------------------------------------------------
create table if not exists depenses (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  libelle       text not null,
  montant       numeric(10, 2) not null check (montant > 0),
  categorie     text not null default 'autre',
  date_depense  timestamptz not null default now()
);

create index if not exists depenses_user_date_idx
  on depenses (user_id, date_depense desc);

-- 2. Profil (objectif d'épargne) --------------------------------------------
create table if not exists profils (
  id                uuid primary key references auth.users(id) on delete cascade,
  objectif_epargne  numeric(10, 2)
);

-- 3. Row Level Security ------------------------------------------------------
-- Chaque utilisateur ne voit et ne modifie QUE ses propres lignes.
-- Sans ces politiques, la clé anon ne peut rien lire.

alter table depenses enable row level security;
alter table profils  enable row level security;

create policy "depenses de l'utilisateur"
  on depenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profil de l'utilisateur"
  on profils for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
