import { createClient } from "../../../../lib/supabase/server";
import { CodesPanel }   from "./CodesPanel";

export default async function SbxCodesPage() {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("token_codes")
    .select("id, code_indice, tokens, expire_le, utilise_le, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Codes de recharge</h1>
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4">
          <p className="text-red-400 text-sm font-medium">Erreur lors du chargement</p>
          <p className="text-red-400/60 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  const now = new Date().toISOString();

  const codes = (raw ?? []).map((c: Record<string, unknown>) => {
    const used    = Boolean(c.utilise_le);
    const expired = !used && (c.expire_le as string) < now;
    return {
      id:             c.id as string,
      code_indice:    c.code_indice as string,
      tokens:         c.tokens as number,
      expire_le:      c.expire_le as string,
      utilise_le:     c.utilise_le as string | null,
      created_at:     c.created_at as string,
      computedStatus: (used ? "utilise" : expired ? "expire" : "actif") as "actif" | "utilise" | "expire",
    };
  });

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Codes de recharge</h1>
      <p className="text-white/40 text-[14px] mb-8">
        {codes.length} code{codes.length !== 1 ? "s" : ""} — le code complet n&apos;est jamais affiché
      </p>
      <CodesPanel codes={codes} />
    </div>
  );
}
