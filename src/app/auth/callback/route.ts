import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) return NextResponse.redirect(`${origin}/connexion`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/connexion?error=callback`);
  }

  const user = data.user;
  const meta = user.user_metadata ?? {};

  // Create atelier record if user signed up as an atelier via OAuth
  if (meta.type === "atelier") {
    const { data: existing } = await supabase
      .from("ateliers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("ateliers").insert({
        user_id: user.id,
        nom: meta.nom_atelier ?? meta.full_name ?? "Atelier",
        telephone: meta.telephone ?? null,
        ville: meta.ville ?? null,
        adresse: meta.adresse ?? null,
        registre_commerce: meta.registre_commerce ?? null,
        statut: "en_attente",
      });
    }
  }

  // Role-based redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (role === "super_admin") return NextResponse.redirect(`${origin}/sbx`);
  if (role === "admin") return NextResponse.redirect(`${origin}/adx`);

  const { data: atelier } = await supabase
    .from("ateliers")
    .select("id, statut")
    .eq("user_id", user.id)
    .maybeSingle();

  if (atelier) return NextResponse.redirect(`${origin}/dashboard`);

  if (next !== "/") return NextResponse.redirect(`${origin}${next}`);
  return NextResponse.redirect(`${origin}/compte`);
}
