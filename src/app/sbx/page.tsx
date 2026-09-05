import { createClient } from "../../../lib/supabase/server";

interface Stats {
  tokens_emis:           number;
  tokens_consommes:      number;
  tokens_en_circulation: number;
  equivalent_dzd:        number;
  taux_token_dzd:        number;
  ateliers_par_statut:   Record<string, number>;
  demandes_par_statut:   Record<string, number>;
}

const ATELIER_LABEL: Record<string, string> = {
  en_attente: "En attente",
  approuve:   "Approuvés",
  refuse:     "Refusés",
};
const DEMANDE_LABEL: Record<string, string> = {
  recue:    "Reçues",
  en_cours: "En cours",
  livree:   "Livrées",
  refusee:  "Refusées",
  annulee:  "Annulées",
};

function fmt(n: number) { return n.toLocaleString("fr-FR"); }

export default async function SbxOverviewPage() {
  const supabase = await createClient();
  const { data: raw, error: statsError } = await supabase.rpc("stats_plateforme");
  const stats = raw as Stats | null;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: livraesMois } = await supabase
    .from("tuning_demandes")
    .select("id", { count: "exact", head: true })
    .eq("statut", "livree")
    .gte("livree_le", monthStart.toISOString());

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Vue d&apos;ensemble</h1>

      {!stats && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4 mb-8">
          <p className="text-red-400 text-sm font-medium">Erreur lors du chargement des statistiques</p>
          {statsError && (
            <p className="text-red-400/60 text-xs mt-1 font-mono">{statsError.message}</p>
          )}
        </div>
      )}

      {stats && (
        <>
          {/* Tokens */}
          <section className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Tokens</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Émis",           val: fmt(stats.tokens_emis) },
                { label: "Consommés",      val: fmt(stats.tokens_consommes) },
                { label: "En circulation", val: fmt(stats.tokens_en_circulation) },
                { label: "Équivalent DZD", val: `${fmt(stats.equivalent_dzd)} DZD`, gold: true },
              ].map(({ label, val, gold }) => (
                <div key={label} className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
                  <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">{label}</p>
                  <p className={`font-display text-3xl font-bold ${gold ? "text-[#F5C842]" : "text-white"}`}>{val}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-white/30">
              Taux actuel : 1 token = {fmt(stats.taux_token_dzd)} DZD
            </p>
          </section>

          {/* Ateliers */}
          <section className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Ateliers</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.ateliers_par_statut).map(([k, v]) => (
                <div key={k} className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
                  <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
                    {ATELIER_LABEL[k] ?? k}
                  </p>
                  <p className="font-display text-3xl font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Demandes */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Demandes de tuning</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.demandes_par_statut).map(([k, v]) => (
                <div key={k} className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
                  <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
                    {DEMANDE_LABEL[k] ?? k}
                  </p>
                  <p className="font-display text-3xl font-bold text-white">{v}</p>
                  {k === "livree" && livraesMois != null && (
                    <p className="text-[10px] text-green-400/70 mt-1">
                      +{livraesMois} ce mois-ci
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
