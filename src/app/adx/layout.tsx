import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { Header }  from "@/components/layout/Header";
import { Footer }  from "@/components/layout/Footer";
import Link        from "next/link";

const NAV = [
  { href: "/adx/demandes",  label: "Demandes" },
  { href: "/adx/recharges", label: "Recharges" },
  { href: "/adx/ateliers",  label: "Ateliers" },
];

export default async function AdxLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/403");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/403");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) redirect("/403");

  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">
        <nav className="border-b border-line bg-card">
          <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,56px)] flex gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className="px-4 py-3 text-sm font-medium text-ink2 border-b-2 border-transparent hover:text-ink hover:border-line2 transition-[color,border-color] duration-150">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="flex-1 max-w-[1300px] w-full mx-auto px-[clamp(18px,4.5vw,56px)] py-8 sm:py-12">
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}
