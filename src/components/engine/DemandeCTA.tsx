"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "../../../lib/supabase/client";

interface Props {
  engineId: string;
  label?: string;
  className?: string;
}

export function DemandeCTA({ engineId, label = "Demander ce fichier →", className = "" }: Props) {
  const router     = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/connexion?next=/demande/${engineId}`);
      return;
    }

    const { data: atelier } = await supabase
      .from("ateliers")
      .select("statut")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!atelier || atelier.statut !== "approuve") {
      router.push("/compte?notice=upload_reserved");
      return;
    }

    router.push(`/demande/${engineId}`);
  }

  return (
    <Button
      variant="solid"
      disabled={busy}
      onClick={handleClick}
      className={`flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
    >
      <Upload size={15} aria-hidden />
      {busy ? "Vérification…" : label}
    </Button>
  );
}
