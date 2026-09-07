import { NextResponse }                   from "next/server";
import { createClient }                   from "../../../../lib/supabase/server";
import { createAdminClient }              from "../../../../lib/supabase/admin";
import { sendNouvelAtelierNotifAdmins }   from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code    = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // Accept only relative paths (not protocol-relative "//") to prevent open-redirect
  const next    = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

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
      const atelierNom = meta.nom_atelier ?? meta.full_name ?? "Atelier";
      await supabase.from("ateliers").insert({
        user_id:           user.id,
        nom:               atelierNom,
        telephone:         meta.telephone ?? null,
        ville:             meta.ville ?? null,
        adresse:           meta.adresse ?? null,
        registre_commerce: meta.registre_commerce ?? null,
        statut:            "en_attente",
      });

      // Notifier tous les admins et super_admins de la nouvelle inscription
      try {
        const adminSb = createAdminClient();
        const { data: adminProfiles } = await adminSb
          .from("profiles")
          .select("email")
          .in("role", ["admin", "super_admin"]);
        const adminEmails = (adminProfiles ?? [])
          .map((p: { email: string | null }) => p.email)
          .filter((e): e is string => !!e);
        await sendNouvelAtelierNotifAdmins(adminEmails, {
          nom:   atelierNom,
          ville: meta.ville ?? null,
          email: user.email ?? "",
        });
      } catch (err) {
        console.error("[callback] Erreur notification admins:", err);
      }
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

  // No atelier → regular user, honour ?next= or go to /compte
  if (!atelier) {
    if (next !== "/") return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/compte`);
  }

  // Atelier exists: status determines destination
  if (atelier.statut === "approuve") return NextResponse.redirect(`${origin}/dashboard`);
  return NextResponse.redirect(`${origin}/en-attente`);
}
