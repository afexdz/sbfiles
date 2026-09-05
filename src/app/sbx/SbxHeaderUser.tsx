"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

interface Props {
  nom:   string | null;
  email: string | null;
}

export function SbxHeaderUser({ nom, email }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/connexion");
  }

  return (
    <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/[0.08] shrink-0">
      <div className="text-right hidden sm:block">
        <p className="text-[12px] font-medium text-white/70 leading-tight">{nom ?? "Super Admin"}</p>
        <p className="text-[10px] text-white/30 leading-tight">{email ?? ""}</p>
      </div>
      <button
        onClick={signOut}
        className="px-3 py-1.5 text-[12px] border border-white/10 text-white/40 rounded-[6px] hover:border-white/20 hover:text-white/70 transition-colors duration-150 cursor-pointer whitespace-nowrap"
      >
        Déconnexion
      </button>
    </div>
  );
}
