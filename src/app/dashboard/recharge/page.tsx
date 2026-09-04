import { redirect }      from "next/navigation";
import { revalidatePath }  from "next/cache";
import { createClient }    from "../../../../lib/supabase/server";
import { Header }          from "@/components/layout/Header";
import { Footer }          from "@/components/layout/Footer";
import { RechargeForm }    from "@/components/dashboard/RechargeForm";
import Link                from "next/link";
import type { TokenRequest, TokenRequestStatut } from "@/lib/types";

const WRAP = "max-w-[900px] mx-auto px-[clamp(18px,4.5vw,56px)]";

const STATUS_BADGE: Record<TokenRequestStatut, string> = {
  en_attente:   "bg-soft text-mute",
  code_genere:  "bg-[#EFF6FF] text-[#1D4ED8]",
  expediee:     "bg-ember-soft text-ember-ink",
  livree:       "bg-[#ECFDF5] text-[#047857]",
  utilisee:     "bg-[#F5F3FF] text-[#6D28D9]",
  annulee:      "bg-soft text-mute",
};

const STATUS_LABEL: Record<TokenRequestStatut, string> = {
  en_attente:  "En attente",
  code_genere: "Code généré",
  expediee:    "Expédiée",
  livree:      "Livrée",
  utilisee:    "Utilisée",
  annulee:     "Annulée",
};

type Result = { ok: boolean; message: string } | null;

export default async function RechargePage() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: atelier } = await supabase
    .from("ateliers")
    .select("id, statut")
    .eq("user_id", user.id)
    .eq("statut", "approuve")
    .maybeSingle();

  if (!atelier) redirect("/dashboard");

  const [requestsRes, settingsRes] = await Promise.all([
    supabase
      .from("token_requests")
      .select("*")
      .eq("atelier_id", atelier.id)
      .order("created_at", { ascending: false }),
    supabase.from("app_settings").select("valeur").eq("cle", "token_dzd").single(),
  ]);

  const requests = (requestsRes.data as TokenRequest[]) ?? [];
  const tokenDzd = parseInt(settingsRes.data?.valeur ?? "1000");

  async function createRequest(_prev: Result, fd: FormData): Promise<Result> {
    "use server";
    const tokens = parseInt(fd.get("tokens") as string);
    const adresse = (fd.get("adresse") as string)?.trim();
    const telephone = (fd.get("telephone") as string)?.trim();

    if (!tokens || tokens < 1) return { ok: false, message: "Nombre de tokens invalide." };
    if (!adresse)             return { ok: false, message: "Adresse requise." };
    if (!telephone)           return { ok: false, message: "Téléphone requis." };

    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };

    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) return { ok: false, message: "Non authentifié." };

    const { data: at } = await sb
      .from("ateliers")
      .select("id")
      .eq("user_id", u.id)
      .eq("statut", "approuve")
      .maybeSingle();
    if (!at) return { ok: false, message: "Atelier non approuvé." };

    const { error } = await sb.from("token_requests").insert({
      atelier_id:        at.id,
      tokens_demandes:   tokens,
      adresse_livraison: adresse,
      telephone,
    });

    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/recharge");
    return { ok: true, message: "Demande envoyée. Notre équipe vous contactera sous 24 h." };
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-8 sm:py-12`}>
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-sm text-mute hover:text-ink2 transition-colors"
            >
              ← Tableau de bord
            </Link>
            <h1 className="font-display text-[clamp(24px,3vw,34px)] mt-2">
              Demande de recharge
            </h1>
            <p className="text-ink2 text-[14.5px] mt-1">
              1 token = {tokenDzd.toLocaleString("fr-FR")} DZD
            </p>
          </div>

          <div className="grid sm:grid-cols-[1fr_1fr] gap-8">
            {/* Formulaire */}
            <div className="bg-card border border-line rounded-[14px] p-6 shadow-card">
              <h2 className="font-display text-lg mb-4">Nouvelle demande</h2>
              <RechargeForm action={createRequest} tokenDzd={tokenDzd} />
            </div>

            {/* Demandes en cours */}
            <div>
              <h2 className="font-display text-lg mb-4">Mes demandes</h2>
              {requests.length === 0 ? (
                <p className="text-mute text-sm">Aucune demande.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="bg-card border border-line rounded-[10px] p-4 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">
                            {r.tokens_demandes} token{r.tokens_demandes > 1 ? "s" : ""}
                          </p>
                          <p className="text-mute text-xs mt-0.5">
                            {new Date(r.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.statut]}`}>
                          {STATUS_LABEL[r.statut]}
                        </span>
                      </div>
                      {r.statut === "expediee" && (
                        <div className="mt-3 pt-3 border-t border-line text-xs text-ink2 space-y-0.5">
                          {r.transporteur && <p>Transporteur : {r.transporteur}</p>}
                          {r.numero_suivi && <p>Suivi : <span className="font-mono">{r.numero_suivi}</span></p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
