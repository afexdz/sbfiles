import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import Link from "next/link";

const NAV = [
  { href: "/sbx",           label: "Vue d'ensemble" },
  { href: "/sbx/admins",    label: "Administrateurs" },
  { href: "/sbx/ateliers",  label: "Ateliers" },
  { href: "/sbx/finance",   label: "Finance" },
  { href: "/sbx/codes",     label: "Codes" },
  { href: "/sbx/journal",   label: "Journal" },
  { href: "/sbx/reglages",  label: "Réglages" },
];

export default async function SbxLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/403");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/403");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "super_admin") redirect("/403");

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col">
      {/* Bandeau SUPER ADMIN */}
      <div className="bg-[#F5C842] text-[#0B0C10] text-[11px] font-bold tracking-[0.18em] text-center py-1 uppercase select-none">
        SUPER ADMIN — Espace restreint
      </div>

      {/* En-tête */}
      <header className="border-b border-white/[0.07] bg-[#111216] shrink-0">
        <div className="max-w-[1400px] mx-auto px-[clamp(18px,4vw,56px)] h-14 flex items-center justify-between gap-4">
          <span className="font-display text-lg tracking-tight">
            SBFiles <span className="text-[#F5C842]">·</span> Super Admin
          </span>
          <nav className="flex flex-wrap gap-0.5">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white hover:bg-white/[0.06] rounded transition-colors duration-150 whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-[clamp(18px,4vw,56px)] py-8">
        {children}
      </main>
    </div>
  );
}
