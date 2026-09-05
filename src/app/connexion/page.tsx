"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const WRAP = "max-w-[440px] mx-auto px-[clamp(18px,4.5vw,32px)]";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [nextUrl, setNextUrl]   = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setNextUrl(p.get("next") ?? "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Identifiants incorrects.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role;
    if (role === "super_admin") { router.push("/sbx"); return; }
    if (role === "admin")       { router.push("/adx"); return; }

    // Honour ?next= for regular users
    if (nextUrl) { router.push(nextUrl); return; }

    const { data: atelier } = await supabase
      .from("ateliers")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    router.push(atelier ? "/dashboard" : "/compte");
  }

  async function handleGoogle() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={`${WRAP} py-14 sm:py-20`}>
          <h1 className="font-display text-[clamp(26px,3.5vw,34px)] mb-1 text-center">
            Se connecter
          </h1>
          <p className="text-ink2 text-sm text-center mb-8">
            Atelier professionnel ?{" "}
            <Link href="/inscription" className="text-ember hover:underline font-medium">
              Créer un compte atelier
            </Link>
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
                className="w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition"
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
