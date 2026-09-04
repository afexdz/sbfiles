"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Result = { ok: boolean; message: string; tokens_credites?: number; nouveau_solde?: number } | null;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 bg-ember text-white font-semibold text-sm px-5 py-2.5 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Vérification…" : "Utiliser"}
    </button>
  );
}

export function CodeRedemptionForm({
  action,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
}) {
  const [state, dispatch] = useActionState(action, null);

  function formatCode(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
    const parts = [raw.slice(0, 4), raw.slice(4, 8), raw.slice(8, 12)].filter(Boolean);
    e.target.value = parts.join("-");
  }

  return (
    <form action={dispatch} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="code"
          type="text"
          placeholder="XXXX-XXXX-XXXX"
          maxLength={14}
          required
          onChange={formatCode}
          className="flex-1 bg-card border border-line rounded-lg px-4 py-2.5 text-sm font-mono tracking-widest placeholder:text-mute focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-[border-color] duration-150 uppercase"
        />
        <SubmitBtn />
      </div>
      {state && (
        <p
          className={`text-sm font-medium ${state.ok ? "text-ok" : "text-ember"}`}
          role="alert"
        >
          {state.ok
            ? `✓ ${state.tokens_credites} token${(state.tokens_credites ?? 0) > 1 ? "s" : ""} crédité${(state.tokens_credites ?? 0) > 1 ? "s" : ""} — nouveau solde : ${state.nouveau_solde}`
            : `✗ ${state.message}`}
        </p>
      )}
    </form>
  );
}
