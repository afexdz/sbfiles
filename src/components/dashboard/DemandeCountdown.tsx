"use client";

import { useEffect, useState } from "react";

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s restantes`;
}

export function DemandeCountdown({
  telechargeLeIso,
  delaiHeures,
}: {
  telechargeLeIso: string;
  delaiHeures: number;
}) {
  const deadline = new Date(telechargeLeIso).getTime() + delaiHeures * 3_600_000;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadline - now;

  if (remaining <= 0) {
    return (
      <span className="text-ember text-xs font-medium">
        Traitement en cours, délai dépassé
      </span>
    );
  }

  return (
    <span className="text-ink2 text-xs tabular-nums">
      {formatMs(remaining)}
    </span>
  );
}
