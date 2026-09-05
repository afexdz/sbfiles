import { createClient } from "../../../../lib/supabase/server";
import { FinancePanel }  from "./FinancePanel";

export default async function SbxFinancePage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("token_ledger")
    .select(`
      id, delta, motif, note, created_at,
      atelier:ateliers(nom)
    `)
    .order("created_at", { ascending: false })
    .limit(1000);

  const entries = (raw ?? []).map((r: Record<string, unknown>) => ({
    id:          r.id as string,
    delta:       r.delta as number,
    motif:       r.motif as string,
    note:        r.note as string | null,
    created_at:  r.created_at as string,
    atelier_nom: (r.atelier as { nom: string } | null)?.nom ?? "—",
  }));

  const { data: ateliersList } = await supabase
    .from("ateliers").select("nom").order("nom");
  const ateliers = (ateliersList ?? []).map((a: Record<string, unknown>) => a.nom as string);

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Finance</h1>
      <p className="text-white/40 text-[14px] mb-8">Journal complet des mouvements de tokens</p>
      <FinancePanel entries={entries} ateliers={ateliers} />
    </div>
  );
}
