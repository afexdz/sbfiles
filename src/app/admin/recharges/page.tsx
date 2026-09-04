import { revalidatePath }   from "next/cache";
import { createClient }      from "../../../../lib/supabase/server";
import { RechargeTable }     from "@/components/admin/RechargeTable";
import type { TokenRequest } from "@/lib/types";

export default async function AdminRechargesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("token_requests")
    .select(`
      *,
      atelier:ateliers (nom),
      token_codes (code_indice)
    `)
    .order("created_at", { ascending: false });

  const requests = (data ?? []).map((r: Record<string, unknown>) => ({
    ...(r as TokenRequest),
    atelier_nom: (r.atelier as { nom: string } | null)?.nom,
    code_indice: (r.token_codes as { code_indice: string } | null)?.code_indice,
  }));

  async function generateCode(
    requestId: string,
    tokens: number,
    jours: number,
  ): Promise<{ ok: boolean; code?: string; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { data: code, error } = await sb.rpc("generer_code_token", {
      p_request: requestId,
      p_tokens:  tokens,
      p_jours:   jours,
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/recharges");
    return { ok: true, code: code as string };
  }

  async function markShipped(
    requestId: string,
    transporteur: string,
    numero: string,
  ): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient().catch(() => null);
    if (!sb) return { ok: false, message: "Erreur serveur." };
    const { error } = await sb
      .from("token_requests")
      .update({ statut: "expediee", transporteur, numero_suivi: numero })
      .eq("id", requestId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/recharges");
    return { ok: true };
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[clamp(24px,3vw,34px)]">Demandes de recharge</h1>
        <p className="text-ink2 text-[14.5px] mt-1">{requests.length} demande{requests.length !== 1 ? "s" : ""}</p>
      </div>
      <RechargeTable
        requests={requests}
        generateCodeAction={generateCode}
        markShippedAction={markShipped}
      />
    </>
  );
}
