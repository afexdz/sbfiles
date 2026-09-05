import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import type { Profile, Atelier } from "./types";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data as Profile | null;
}

export async function getAtelier(): Promise<Atelier | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("ateliers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data as Atelier | null;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/connexion");
  return profile;
}

export async function requireAtelierApprouve(): Promise<{ profile: Profile; atelier: Atelier }> {
  const profile = await requireAuth();
  const atelier = await getAtelier();
  if (!atelier || atelier.statut !== "approuve") redirect("/403");
  return { profile, atelier };
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== "admin" && profile.role !== "super_admin") redirect("/403");
  return profile;
}

export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== "super_admin") redirect("/403");
  return profile;
}
