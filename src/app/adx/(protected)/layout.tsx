import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { Header }  from "@/components/layout/Header";
import { Footer }  from "@/components/layout/Footer";

export default async function AdxProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/adx/connexion");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/adx/connexion");

  const { data: profile } = await supabase
    .from("profiles").select("role, nom, email").eq("id", user.id).single();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) redirect("/403");

  const adminName = profile?.nom || profile?.email || "Admin";

  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-line bg-card">
          <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,56px)] flex items-center justify-between h-12">
            <span className="text-sm font-medium text-ink">Espace admin</span>
            <span className="text-xs text-mute">{adminName}</span>
          </div>
        </div>
        <main className="flex-1 max-w-[1300px] w-full mx-auto px-[clamp(18px,4.5vw,56px)] py-8 sm:py-12">
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}
