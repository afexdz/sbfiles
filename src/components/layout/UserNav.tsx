"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UserNav() {
  const router             = useRouter();
  const [user, setUser]    = useState<User | null | undefined>(undefined);
  const [open, setOpen]    = useState(false);
  const [role, setRole]    = useState<string | null>(null);
  const [hasAtelier, setHasAtelier] = useState(false);
  const panelRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) loadProfile(supabase, data.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(supabase, session.user.id);
      else { setRole(null); setHasAtelier(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(supabase: ReturnType<typeof createClient>, userId: string) {
    const [{ data: profile }, { data: atelier }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).single(),
      supabase.from("ateliers").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    setRole(profile?.role ?? null);
    setHasAtelier(!!atelier);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // Still loading
  if (user === undefined) return null;

  // Not logged in
  if (!user) {
    return (
      <>
        <Link
          href="/connexion"
          className="hidden [min-width:940px]:inline-flex items-center text-sm font-medium text-ink2 hover:text-ink transition-colors duration-[180ms] px-3 py-1.5"
        >
          Se connecter
        </Link>
        <Link
          href="/inscription"
          className="hidden [min-width:940px]:inline-flex items-center bg-ember text-white text-sm font-semibold px-4 py-1.5 rounded hover:bg-ember-ink transition-colors duration-[180ms]"
        >
          Créer un compte
        </Link>
      </>
    );
  }

  const workspaceHref =
    role === "super_admin" ? "/sbx"
    : role === "admin" ? "/adx"
    : hasAtelier ? "/dashboard"
    : "/compte";

  const workspaceLabel =
    role === "super_admin" ? "Super admin"
    : role === "admin" ? "Administration"
    : hasAtelier ? "Tableau de bord"
    : "Mon compte";

  const initials = (user.user_metadata?.nom ?? user.email ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu utilisateur"
        className="flex items-center gap-2 text-sm font-medium text-ink hover:text-ember transition-colors duration-[180ms] cursor-pointer"
      >
        <span className="w-8 h-8 rounded-full bg-ember text-white text-xs font-bold grid place-items-center select-none">
          {initials}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[80] w-52 bg-card border border-line rounded-[12px] shadow-card-lg py-1 text-sm"
        >
          <div className="px-4 py-2.5 border-b border-line">
            <p className="font-semibold text-ink truncate">
              {user.user_metadata?.nom ?? user.email}
            </p>
            <p className="text-xs text-mute truncate">{user.email}</p>
          </div>

          <Link
            href={workspaceHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2 text-ink hover:bg-soft transition-colors duration-[120ms]"
          >
            {workspaceLabel}
          </Link>

          <Link
            href="/compte"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2 text-ink hover:bg-soft transition-colors duration-[120ms]"
          >
            Paramètres du compte
          </Link>

          <div className="border-t border-line mt-1 pt-1">
            <button
              role="menuitem"
              onClick={signOut}
              className="w-full text-left px-4 py-2 text-ember hover:bg-soft transition-colors duration-[120ms] cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
