# Appliquer les migrations Supabase

## 0001_init.sql — Schéma + seed de base

Crée toutes les tables, index, politiques RLS et insère les 8 catégories,
12 types de tuning et 18 options.

## 0002_seed_vehicles.sql — Véhicules

Insère 57 marques, 28 modèles, 31 périodes et 82 motorisations extraites
de `design/reference.html`.

---

## Procédure dans le SQL Editor de Supabase

1. Ouvre [app.supabase.com](https://app.supabase.com) et sélectionne ton projet.
2. Va dans **SQL Editor** (icône `>_` dans la barre latérale gauche).
3. Clique **New query**.
4. Copie-colle le contenu de `supabase/migrations/0001_init.sql`, puis clique **Run**.
   - Vérifie que la barre verte "Success" apparaît en bas.
5. Répète l'opération avec `supabase/migrations/0002_seed_vehicles.sql`.

> Les deux scripts sont **idempotents** : tu peux les relancer sans risque,
> les doublons sont ignorés grâce aux contraintes `ON CONFLICT DO NOTHING`.

---

## Via Supabase CLI (optionnel)

Si tu utilises la CLI Supabase localement :

```bash
supabase db push
```

La CLI applique automatiquement toutes les migrations du dossier
`supabase/migrations/` dans l'ordre numérique.

---

## Vérification rapide

Après avoir appliqué `0002`, exécute cette requête pour contrôler les
comptages :

```sql
select 'brands'  as tbl, count(*) from brands
union all
select 'models',          count(*) from models
union all
select 'periods',         count(*) from periods
union all
select 'engines',         count(*) from engines;
```

Résultats attendus : **57 / 28 / 31 / 82**.
