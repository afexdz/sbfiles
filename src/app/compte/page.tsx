import { redirect }    from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { Header }       from "@/components/layout/Header";
import { Footer }       from "@/components/layout/Footer";
import { CompteClient } from "./CompteClient";
import type { Profile, Atelier } from "@/lib/types";

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [profileRes, atelierRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("ateliers").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = profileRes.data as Profile | null;
  const atelier = atelierRes.data as Atelier | null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <CompteClient profile={profile} atelier={atelier} notice={notice ?? null} />
      </main>
      <Footer />
    </>
  );
}
