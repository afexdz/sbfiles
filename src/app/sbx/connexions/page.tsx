import { createClient }       from "../../../../lib/supabase/server";
import { ConnectionsPanel }   from "./ConnectionsPanel";

export default async function SbxConnexionsPage() {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("login_attempts")
    .select("id, email, ip, user_agent, reussi, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return (
      <div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-8">Connexions récentes</h1>
        <div className="bg-red-900/20 border border-red-800/40 rounded-[12px] px-5 py-4">
          <p className="text-red-400 text-sm font-medium">Erreur lors du chargement</p>
          <p className="text-red-400/60 text-xs mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  const attempts = (raw ?? []) as {
    id: string; email: string | null; ip: string | null;
    user_agent: string | null; reussi: boolean; created_at: string;
  }[];

  // Detect suspicious: same (ip, email), 3+ failures in last 24 h
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentFailures } = await supabase
    .from("login_attempts")
    .select("ip, email")
    .eq("reussi", false)
    .gte("created_at", window24h);

  const failCount: Record<string, number> = {};
  for (const f of recentFailures ?? []) {
    const row = f as { ip: string | null; email: string | null };
    if (!row.ip || !row.email) continue;
    const key = `${row.ip}|${row.email}`;
    failCount[key] = (failCount[key] ?? 0) + 1;
  }

  const suspiciousKeys = Object.entries(failCount)
    .filter(([, n]) => n >= 3)
    .map(([key]) => key);

  const successCount = attempts.filter((a) => a.reussi).length;
  const failureCount = attempts.length - successCount;

  return (
    <div>
      <h1 className="font-display text-[clamp(26px,3vw,36px)] text-white mb-2">Connexions récentes</h1>
      <p className="text-white/40 text-[14px] mb-6">
        {attempts.length} tentative{attempts.length !== 1 ? "s" : ""} —{" "}
        <span className="text-green-400">{successCount} réussie{successCount !== 1 ? "s" : ""}</span>
        {" · "}
        <span className="text-red-400">{failureCount} échec{failureCount !== 1 ? "s" : ""}</span>
      </p>
      <ConnectionsPanel attempts={attempts} suspiciousKeys={suspiciousKeys} />
    </div>
  );
}
