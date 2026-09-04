import { redirect }  from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { Header }    from "@/components/layout/Header";
import { Footer }    from "@/components/layout/Footer";
import Link          from "next/link";

const NAV = [
  { href: "/admin/recharges", label: "Recharges" },
  { href: "/admin/demandes",  label: "Demandes" },
  { href: "/admin/ateliers",  label: "Ateliers" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">
        {/* Barre de navigation admin */}
        <nav className="border-b border-line bg-card">
          <div className="max-w-[1300px] mx-auto px-[clamp(18px,4.5vw,56px)] flex gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-4 py-3 text-sm font-medium text-ink2 border-b-2 border-transparent hover:text-ink hover:border-line2 transition-[color,border-color] duration-150"
                style={{}}
              >
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
