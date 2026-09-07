"use server";

import { createAdminClient } from "../../../lib/supabase/admin";

export interface AtelierInput {
  nom:               string;
  ville:             string;
  adresse:           string;
  registre_commerce: string;
}

/**
 * Crée la fiche atelier immédiatement après signUp, sans attendre la
 * confirmation email. Utilise le client service_role pour contourner RLS.
 * Idempotent : renvoie ok:true si la fiche existe déjà.
 */
export async function creerAtelierEnAttente(
  userId: string,
  data:   AtelierInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !data.nom.trim()) {
    return { ok: false, error: "Données manquantes." };
  }

  const adminSb = createAdminClient();

  // Vérifier que le profil existe (le trigger on_auth_user_created est synchrone,
  // donc il doit avoir créé la ligne avant que signUp() ne retourne)
  const { data: profile } = await adminSb
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    // Rare : profil pas encore visible (latence réseau extrême). On insère quand même.
    console.warn(`[inscription] profil ${userId} introuvable juste après signUp — tentative d'insertion directe`);
  }

  // Idempotent : ne pas créer si déjà présent (ex. double-clic ou OAuth)
  const { data: existing } = await adminSb
    .from("ateliers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { ok: true };

  const { error } = await adminSb.from("ateliers").insert({
    user_id:           userId,
    nom:               data.nom.trim(),
    ville:             data.ville   || null,
    adresse:           data.adresse || null,
    registre_commerce: data.registre_commerce || null,
    statut:            "en_attente",
  });

  if (error) {
    console.error("[inscription] Erreur création atelier:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
