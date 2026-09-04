"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Result = { ok: boolean; message: string } | null;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ember text-white font-semibold text-sm px-5 py-3 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Envoi en cours…" : "Envoyer la demande de recharge"}
    </button>
  );
}

export function RechargeForm({
  action,
  tokenDzd,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  tokenDzd: number;
}) {
  const [state, dispatch] = useActionState(action, null);

  return (
    <form action={dispatch} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Nombre de tokens souhaité
        </label>
        <input
          name="tokens"
          type="number"
          min={1}
          required
          placeholder="ex. 10"
          className="w-full bg-card border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-[border-color] duration-150"
          onChange={(e) => {
            const qty = parseInt(e.target.value) || 0;
            const preview = document.getElementById("dzd-preview");
            if (preview) {
              preview.textContent = qty > 0
                ? `= ${(qty * tokenDzd).toLocaleString("fr-FR")} DZD`
                : "";
            }
          }}
        />
        <p id="dzd-preview" className="mt-1 text-sm text-mute" />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Adresse de livraison
        </label>
        <textarea
          name="adresse"
          required
          rows={3}
          placeholder="Adresse complète pour la livraison du code physique"
          className="w-full bg-card border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-[border-color] duration-150 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Téléphone
        </label>
        <input
          name="telephone"
          type="tel"
          required
          placeholder="0XX XX XX XX XX"
          className="w-full bg-card border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-[border-color] duration-150"
        />
      </div>

      <SubmitBtn />

      {state && (
        <p
          className={`text-sm font-medium ${state.ok ? "text-ok" : "text-ember"}`}
          role="alert"
        >
          {state.ok ? `✓ ${state.message}` : `✗ ${state.message}`}
        </p>
      )}
    </form>
  );
}
