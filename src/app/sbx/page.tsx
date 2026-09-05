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
  const { data: raw } = await supabase.rpc("stats_plateforme");
  const stats = raw as Stats | null;

  if (!stats) {
    return <p className="text-white/50 text-sm">Impossible de charger les statistiques.</p>;
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Vue d&apos;ensemble</h1>

      {/* Tokens */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Tokens</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Émis",          val: fmt(stats.tokens_emis) },
            { label: "Consommés",     val: fmt(stats.tokens_consommes) },
            { label: "En circulation",val: fmt(stats.tokens_en_circulation) },
            { label: "Équivalent DZD",val: `${fmt(stats.equivalent_dzd)} DZD`, gold: true },
          ].map(({ label, val, gold }) => (
            <div key={label} className="bg-[#13141A] border border-white/[0.07] rounded-[12px] p-5">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">{label}</p>
              <p className={`font-display text-3xl font-bold ${gold ? "text-[#F5C842]" : "text-white"}`}>
                {val}
              </p>
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
