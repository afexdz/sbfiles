"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

interface Props {
  statut:    string;
  noteAdmin: string | null;
}

export function EnAttenteClient({ statut, noteAdmin }: Props) {
  const router    = useRouter();
  const isRefuse  = statut === "refuse";

  async function handleSignOut() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/connexion");
  }

  return (
    <div className="max-w-[480px] mx-auto px-[clamp(18px,4.5vw,32px)] py-20 text-center space-y-6">
      <div className="text-5xl select-none">{isRefuse ? "✗" : "⏳"}</div>

      <h1 className="font-display text-[clamp(24px,3vw,32px)]">
        {isRefuse ? "Demande refusée" : "Inscription en cours de validation"}
      </h1>

      <p className="text-ink2 text-sm max-w-sm mx-auto leading-relaxed">
        {isRefuse
          ? (noteAdmin ?? "Votre demande d'adhésion n'a pas été acceptée. Contactez-nous pour plus d'informations.")
          : "Votre inscription est en cours de validation. Vous recevrez un email dès que votre compte sera approuvé."}
      </p>

      <button
        onClick={handleSignOut}
        className="text-sm text-mute hover:text-ember transition-colors duration-150 cursor-pointer"
      >
        Se déconnecter
      </button>
    </div>
  );
}
