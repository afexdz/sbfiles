"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { logLoginAttempt }    from "../../actions/logLogin";
import { checkLoginRateLimit } from "../../actions/checkRateLimit";

export default function AdxConnexionPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { blocked, waitMinutes } = await checkLoginRateLimit(email);
    if (blocked) {
      setError(`Trop de tentatives. Réessayez dans ${waitMinutes} minutes.`);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      await logLoginAttempt({ email, profileId: null, reussi: false });
      setError("Identifiants incorrects.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      await logLoginAttempt({ email, profileId: data.user.id, reussi: false });
      await supabase.auth.signOut();
      setError("Accès réservé aux administrateurs.");
      setLoading(false);
      return;
    }

    await logLoginAttempt({ email, profileId: data.user.id, reussi: true });
    router.push("/adx/demandes");
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-ink mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="font-display text-[28px] text-ink">Espace administrateur</h1>
          <p className="text-ink2 text-sm mt-1">SBFiles · Accès restreint</p>
        </div>

        <div className="bg-white border border-line rounded-[14px] p-6 shadow-sm">
          {error && (
            <div className="mb-4 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#B91C1C] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@exemple.com"
                className="w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ember text-white font-semibold text-sm py-3 rounded-[10px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-mute">
          Espace atelier ?{" "}
          <a href="/connexion" className="text-ink2 hover:text-ink transition-colors duration-150">
            Connexion atelier →
          </a>
        </p>
      </div>
    </div>
  );
}
