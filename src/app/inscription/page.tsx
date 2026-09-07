"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient }           from "../../../lib/supabase/client";
import { creerAtelierEnAttente }  from "./atelierAction";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

const WRAP  = "max-w-[480px] mx-auto px-[clamp(18px,4.5vw,32px)]";
const INPUT =
  "w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white";

export default function InscriptionPage() {
  const [nextUrl, setNextUrl] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setNextUrl(p.get("next") ?? "");
  }, []);

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [nomAtelier, setNomAtelier] = useState("");
  const [wilaya,     setWilaya]     = useState("");
  const [adresse,    setAdresse]    = useState("");
  const [registre,   setRegistre]   = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const metadata = {
      type: "atelier",
      nom_atelier: nomAtelier,
      ville: wilaya,
      adresse,
      registre_commerce: registre,
    };

    const emailRedirectTo =
      `${window.location.origin}/auth/callback` +
      (nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : "");

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo },
    });

    if (signUpError) { setLoading(false); setError(signUpError.message); return; }

    // Créer la fiche atelier immédiatement — ne pas attendre la confirmation email
    // (le callback /auth/callback est un filet de sécurité supplémentaire)
    if (signUpData?.user?.id) {
      const result = await creerAtelierEnAttente(signUpData.user.id, {
        nom:               nomAtelier,
        ville:             wilaya,
        adresse,
        registre_commerce: registre,
      });
      if (!result.ok) {
        console.error("[inscription] creerAtelierEnAttente:", result.error);
      }
    }

    setLoading(false);
    setSuccess(true);
  }

  async function handleGoogle() {
    const supabase = createClient();
    const redirectTo =
      `${window.location.origin}/auth/callback` +
      (nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : "");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { type: "atelier" } },
    });
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className={`${WRAP} py-20 text-center space-y-4`}>
            <div className="text-5xl">✉️</div>
            <h1 className="font-display text-2xl">Vérifiez votre boîte mail</h1>
            <p className="text-ink2 text-sm max-w-sm mx-auto">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>.
              Cliquez dessus pour activer votre compte atelier.
              {nextUrl && " Vous serez ensuite redirigé automatiquement."}
            </p>
            <Link
              href="/connexion"
              className="inline-block text-ember text-sm hover:underline font-medium"
            >
              Retour à la connexion
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-14 sm:py-20`}>
          <h1 className="font-display text-[clamp(26px,3.5vw,34px)] mb-1 text-center">
            Créer un compte atelier
          </h1>
          <p className="text-ink2 text-sm text-center mb-8">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-ember hover:underline font-medium">
              Se connecter
            </Link>
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#B91C1C] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Adresse e-mail" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className={INPUT}
              />
            </Field>

            <Field label="Mot de passe" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={6}
                className={INPUT}
              />
            </Field>

            <div className="pt-3 border-t border-line">
              <p className="text-xs font-semibold text-mute uppercase tracking-wider mb-3">
                Votre atelier
              </p>
            </div>

            <Field label="Nom de l'atelier" required>
              <input
                type="text"
                value={nomAtelier}
                onChange={(e) => setNomAtelier(e.target.value)}
                required
                placeholder="Ex : Garage Auto Elite"
                className={INPUT}
              />
            </Field>

            <Field label="Wilaya" required>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                required
                className={INPUT}
              >
                <option value="">— Sélectionnez —</option>
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </Field>

            <Field label="Adresse">
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Rue, quartier…"
                className={INPUT}
              />
            </Field>

            <Field label="Registre de commerce">
              <input
                type="text"
                value={registre}
                onChange={(e) => setRegistre(e.target.value)}
                placeholder="Numéro RC (optionnel)"
                className={INPUT}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ember text-white font-semibold text-sm py-3 rounded-[10px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? "Création…" : "Créer mon compte atelier"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-mute">ou</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-line rounded-[10px] px-4 py-2.5 text-sm font-medium text-ink hover:bg-soft transition-colors duration-150 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            Continuer avec Google
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-ember ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
