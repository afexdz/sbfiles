import { createClient } from "../../../../lib/supabase/server";

export default async function SbxCodesPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("token_codes")
    .select("id, code_indice, tokens, expire_le, utilise_le, created_at, utilise_par")
    .order("created_at", { ascending: false })
    .limit(500);

  const codes = (raw ?? []) as {
    id: string;
    code_indice: string;
    tokens: number;
    expire_le: string;
    utilise_le: string | null;
    created_at: string;
  }[];

  const now = new Date().toISOString();

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Codes de recharge</h1>
      <p className="text-white/40 text-[14px] mb-8">
        {codes.length} code{codes.length !== 1 ? "s" : ""} — le code complet n&apos;est jamais affiché
      </p>

      <div className="border border-white/[0.07] rounded-[12px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.07] text-[11px] text-white/40 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Indice (4 derniers)</th>
              <th className="text-right px-5 py-3">Tokens</th>
              <th className="text-left px-5 py-3">Statut</th>
              <th className="text-left px-5 py-3">Expire le</th>
              <th className="text-left px-5 py-3">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30">Aucun code.</td></tr>
            )}
            {codes.map((c) => {
              const used    = Boolean(c.utilise_le);
              const expired = !used && c.expire_le < now;
              const status  = used ? "Utilisé" : expired ? "Expiré" : "Actif";
              const badge   = used
                ? "bg-white/10 text-white/40"
                : expired
                ? "bg-red-900/30 text-red-400"
                : "bg-green-900/30 text-green-400";
              return (
                <tr key={c.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-mono">
                    <span className="text-white/30">••••-••••-</span>
                    <span className="text-white font-bold">{c.code_indice}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-[#F5C842]">
                    {c.tokens}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {new Date(c.expire_le).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
