"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

type Status = "loading" | "invalid" | "form" | "success";

const WRAP  = "max-w-[440px] mx-auto px-[clamp(18px,4.5vw,32px)]";
const INPUT =
  "w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [status,   setStatus]   = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // PRIMARY: PASSWORD_RECOVERY event fires when createBrowserClient detects
    // #access_token=...&type=recovery in the URL hash (detectSessionInUrl: true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("form");
      }
    });

    // FALLBACK: session already set (e.g. page refresh after hash consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((prev) => {
        if (prev !== "loading") return prev;
        return session ? "form" : prev;
      });
    });

    // TIMEOUT: if neither signal fires, the link is absent or expired
    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "invalid" : prev));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes("jwt")) {
        setError(
          "Ce lien de réinitialisation a expiré ou est invalide. Veuillez en demander un nouveau."
        );
        setStatus("invalid");
      } else {
        setError(updateError.message);
      }
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/connexion"), 2500);
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-14 sm:py-20`}>
          {status === "loading" && <LoadingState />}
          {status === "invalid" && <InvalidState />}
          {status === "form" && (
            <FormState
              password={password}
              confirm={confirm}
              error={error}
              loading={loading}
              setPassword={setPassword}
              setConfirm={setConfirm}
              onSubmit={handleSubmit}
            />
          )}
          {status === "success" && <SuccessState />}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="text-center py-12 space-y-4">
      <Loader size={28} className="mx-auto text-[var(--mute)] animate-spin" aria-hidden />
      <p className="text-[var(--mute)] text-sm">Vérification du lien…</p>
    </div>
  );
}

function InvalidState() {
  return (
    <div className="text-center py-8 space-y-5">
      <div className="flex justify-center">
        <span className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center">
          <AlertCircle size={26} className="text-[#B91C1C]" aria-hidden />
        </span>
      </div>
      <div>
        <h1 className="font-display text-[clamp(22px,3vw,28px)] mb-2">Lien invalide ou expiré</h1>
        <p className="text-[var(--ink2)] text-[14.5px] max-w-[32ch] mx-auto">
          Ce lien de réinitialisation est introuvable, a déjà été utilisé ou a expiré.
        </p>
      </div>
      <Link
        href="/connexion"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ember)] hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}

function FormState({
  password,
  confirm,
  error,
  loading,
  setPassword,
  setConfirm,
  onSubmit,
}: {
  password: string;
  confirm: string;
  error: string | null;
  loading: boolean;
  setPassword: (v: string) => void;
  setConfirm: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <h1 className="font-display text-[clamp(26px,3.5vw,34px)] mb-1 text-center">
        Nouveau mot de passe
      </h1>
      <p className="text-[var(--ink2)] text-sm text-center mb-8">
        Choisissez un mot de passe sécurisé d&apos;au moins 6 caractères.
      </p>

      {error && (
        <div className="mb-5 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#B91C1C] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Nouveau mot de passe <span className="text-[var(--ember)]">*</span>
          </label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Confirmer le mot de passe <span className="text-[var(--ember)]">*</span>
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={6}
            className={INPUT}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ember text-white font-semibold text-sm py-3 rounded-[10px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-60 cursor-pointer mt-2"
        >
          {loading ? "Mise à jour…" : "Définir le nouveau mot de passe"}
        </button>
      </form>
    </>
  );
}

function SuccessState() {
  return (
    <div className="text-center py-8 space-y-5">
      <div className="flex justify-center">
        <span className="w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center">
          <CheckCircle size={26} className="text-[#047857]" aria-hidden />
        </span>
      </div>
      <div>
        <h1 className="font-display text-[clamp(22px,3vw,28px)] mb-2">
          Mot de passe mis à jour
        </h1>
        <p className="text-[var(--ink2)] text-[14.5px]">
          Vous allez être redirigé vers la page de connexion…
        </p>
      </div>
    </div>
  );
}
