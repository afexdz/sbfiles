"use server";

import { revalidatePath } from "next/cache";
import { createClient }   from "../../../../lib/supabase/server";

type SuperAdminCtx = { sb: Awaited<ReturnType<typeof createClient>>; userId: string };

async function verifySuperAdmin(): Promise<SuperAdminCtx | null> {
  const sb = await createClient().catch(() => null);
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "super_admin") return null;
  return { sb, userId: user.id };
}

export interface GenererCodeResult {
  ok:          boolean;
  error?:      string;
  code?:       string;
  id?:         string;
  codeIndice?: string;
  expireAt?:   string;
  createdAt?:  string;
  tokens?:     number;
}

export async function genererCode(tokens: number, jours: number): Promise<GenererCodeResult> {
  if (tokens < 1 || jours < 1) return { ok: false, error: "Paramètres invalides." };
  const ctx = await verifySuperAdmin();
  if (!ctx) return { ok: false, error: "Non autorisé." };

  const { data, error } = await ctx.sb.rpc("generer_code_standalone", {
    p_tokens: tokens,
    p_jours:  jours,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Erreur inconnue." };

  const d = data as { code: string; id: string; code_indice: string; expire_le: string; created_at: string };

  await ctx.sb.from("admin_actions").insert({
    acteur_id:  ctx.userId,
    action:     "generer_code",
    cible_type: "token_codes",
    cible_id:   d.id,
    details:    { tokens, jours },
  });

  revalidatePath("/sbx/codes");
  return {
    ok:         true,
    code:       d.code,
    id:         d.id,
    codeIndice: d.code_indice,
    expireAt:   d.expire_le,
    createdAt:  d.created_at,
    tokens,
  };
}

export async function modifierCode(
  id: string, tokens: number, expireAt: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!id || tokens < 1 || !expireAt) return { ok: false, error: "Paramètres invalides." };
  const ctx = await verifySuperAdmin();
  if (!ctx) return { ok: false, error: "Non autorisé." };

  const { error } = await ctx.sb
    .from("token_codes")
    .update({ tokens, expire_le: expireAt })
    .eq("id", id)
    .is("utilise_le", null);
  if (error) return { ok: false, error: error.message };

  await ctx.sb.from("admin_actions").insert({
    acteur_id:  ctx.userId,
    action:     "modifier_code",
    cible_type: "token_codes",
    cible_id:   id,
    details:    { tokens, expire_le: expireAt },
  });

  revalidatePath("/sbx/codes");
  return { ok: true };
}

export async function invaliderCode(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "ID manquant." };
  const ctx = await verifySuperAdmin();
  if (!ctx) return { ok: false, error: "Non autorisé." };

  const invalide_le = new Date(Date.now() - 1000).toISOString();
  const { error } = await ctx.sb
    .from("token_codes")
    .update({ expire_le: invalide_le })
    .eq("id", id)
    .is("utilise_le", null);
  if (error) return { ok: false, error: error.message };

  await ctx.sb.from("admin_actions").insert({
    acteur_id:  ctx.userId,
    action:     "invalider_code",
    cible_type: "token_codes",
    cible_id:   id,
    details:    { invalide_le },
  });

  revalidatePath("/sbx/codes");
  return { ok: true };
}
