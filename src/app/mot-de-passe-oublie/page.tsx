"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const WRAP  = "max-w-[440px] mx-auto px-[clamp(18px,4.5vw,32px)]";
const INPUT =
  "w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white";

export default function MotDePasseOubliePage() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });

    setLoading(false);

    if (resetError && !resetError.message.toLowerCase().includes("rate limit")) {
      setError("Une erreur réseau est survenue. Veuillez réessayer.");
      return;
    }

    // Always show the same confirmation to avoid email enumeration
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className={`${WRAP} py-14 sm:py-20 text-center space-y-5`}>
            <div className="text-5xl">📬</div>
            <h1 className="font-display text-[clamp(22px,3vw,28px)]">Vérifiez votre boîte mail</h1>
            <p className="text-ink2 text-[14.5px] max-w-[34ch] mx-auto">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>, un lien de
              réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos spams.
            </p>
            <Link
              href="/connexion"
              className="inline-block text-sm font-medium text-ember hover:underline"
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
            Mot de passe oublié
          </h1>
          <p className="text-ink2 text-sm text-center mb-8">
            Saisissez votre adresse e-mail. Vous recevrez un lien pour définir un
            nouveau mot de passe.
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#B91C1C] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className={INPUT}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ember text-white font-semibold text-sm py-3 rounded-[10px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Envoi en cours…" : "Envoyer le lien"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-mute">
            <Link href="/connexion" className="text-ink2 hover:text-ember transition-colors duration-150">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
