import { redirect }          from "next/navigation";
import { createClient }      from "../../../lib/supabase/server";
import { Header }            from "@/components/layout/Header";
import { Footer }            from "@/components/layout/Footer";
import { EnAttenteClient }   from "./EnAttenteClient";

export default async function EnAttentePage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/connexion");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: atelier } = await supabase
    .from("ateliers")
    .select("statut, note_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  // Redirect away if conditions changed since the last login
  if (!atelier)                      redirect("/inscription");
  if (atelier.statut === "approuve") redirect("/dashboard");

  return (
    <>
      <Header />
      <main className="flex-1">
        <EnAttenteClient statut={atelier.statut} noteAdmin={atelier.note_admin} />
      </main>
      <Footer />
    </>
  );
}
