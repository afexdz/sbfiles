"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import type { Profile, Atelier, AtelierStatut } from "@/lib/types";

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued",
  "Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès",
  "In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Menia",
];

const STATUT_LABEL: Record<AtelierStatut, { label: string; className: string }> = {
  en_attente: { label: "En attente de validation",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  approuve:   { label: "Approuvé",                   className: "bg-[#ECFDF5] text-[#047857] border-green-200" },
  refuse:     { label: "Refusé",                     className: "bg-[#FEF2F2] text-[#B91C1C] border-red-200" },
};

const WRAP = "max-w-[600px] mx-auto px-[clamp(18px,4.5vw,32px)]";
const INPUT =
  "w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white";

interface Props {
  profile: Profile | null;
  atelier: Atelier | null;
  notice?: string | null;
}

export function CompteClient({ profile, atelier, notice }: Props) {
  const router = useRouter();

  const [telephone, setTelephone]   = useState(atelier?.telephone ?? "");
  const [ville, setVille]           = useState(atelier?.ville ?? "");
  const [adresse, setAdresse]       = useState(atelier?.adresse ?? "");
  const [registre, setRegistre]     = useState((atelier as (Atelier & { registre_commerce?: string | null }) | null)?.registre_commerce ?? "");
  const [msg, setMsg]               = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving]         = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg({ ok: false, text: "Session expirée." }); setSaving(false); return; }

    if (!atelier) { setSaving(false); return; }

    const { error } = await supabase
      .from("ateliers")
      .update({ telephone, ville, adresse, registre_commerce: registre, updated_at: new Date().toISOString() })
      .eq("id", atelier.id);

    setSaving(false);
    setMsg(error
      ? { ok: false, text: error.message }
      : { ok: true,  text: "Profil mis à jour." }
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const workspaceLink =
    profile?.role === "super_admin" ? "/sbx"
    : profile?.role === "admin" ? "/adx"
    : atelier ? "/dashboard"
    : null;

  return (
    <div className={`${WRAP} py-10 sm:py-14`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[clamp(24px,3vw,32px)]">Mon compte</h1>
          <p className="text-ink2 text-sm mt-0.5">{profile?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-sm text-mute hover:text-ember transition-colors duration-150 cursor-pointer disabled:opacity-60"
        >
          {signingOut ? "…" : "Se déconnecter"}
        </button>
      </div>

      {notice === "upload_reserved" && (
        <div className="mb-6 px-4 py-4 bg-amber-50 border border-amber-200 rounded-[10px] text-sm text-amber-800">
          <p className="font-semibold mb-1">Upload réservé aux ateliers approuvés</p>
          <p>
            {!atelier
              ? "Pour soumettre une demande de reprogrammation, vous devez créer un compte atelier et attendre son approbation."
              : atelier.statut === "en_attente"
              ? "Votre dossier est en cours d'examen. L'upload sera disponible dès son approbation."
              : "Votre demande d'atelier n'a pas été approuvée. Contactez-nous pour plus d'informations."}
          </p>
        </div>
      )}

      {workspaceLink && (
        <div className="mb-6">
          <Link
            href={workspaceLink}
            className="inline-flex items-center gap-2 text-sm font-medium text-ember hover:underline"
          >
            Accéder à mon espace
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}

      {atelier && (
        <div className={`mb-6 px-4 py-3 border rounded-[10px] text-sm font-medium ${STATUT_LABEL[atelier.statut].className}`}>
          Statut atelier : {STATUT_LABEL[atelier.statut].label}
          {atelier.statut === "refuse" && atelier.note_admin && (
            <p className="text-xs font-normal mt-1 opacity-80">{atelier.note_admin}</p>
          )}
        </div>
      )}

      {msg && (
        <div className={`mb-5 px-4 py-3 border rounded-[10px] text-sm ${
          msg.ok
            ? "bg-[#ECFDF5] border-green-200 text-[#047857]"
            : "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]"
        }`}>
          {msg.text}
        </div>
      )}

      {atelier && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="pt-3 border-t border-line">
            <p className="text-xs font-semibold text-mute uppercase tracking-wider mb-3">Atelier</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Téléphone</label>
            <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={INPUT} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Wilaya</label>
            <select value={ville} onChange={(e) => setVille(e.target.value)} className={INPUT}>
              <option value="">— Sélectionnez —</option>
              {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Adresse</label>
            <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} className={INPUT} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Registre de commerce</label>
            <input type="text" value={registre} onChange={(e) => setRegistre(e.target.value)} className={INPUT} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-ember text-white font-semibold text-sm px-6 py-2.5 rounded-[10px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </div>
  );
}
