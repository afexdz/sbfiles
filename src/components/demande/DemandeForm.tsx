"use client";

import { useState, useRef } from "react";
import { createClient }     from "../../../lib/supabase/client";
import { useRouter }        from "next/navigation";
import type { TuningType, Option } from "@/lib/types";

const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo

interface Props {
  engineId:    string;
  atelierId:   string;
  solde:       number;
  tokenDzd:    number;
  tuningTypes: TuningType[];
  options:     Option[];
}

export function DemandeForm({
  engineId, atelierId, solde, tokenDzd, tuningTypes, options,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState<TuningType | null>(null);
  const [selectedOpts, setSelectedOpts] = useState<Set<string>>(new Set());
  const [note, setNote]                 = useState("");
  const [file, setFile]                 = useState<File | null>(null);
  const [fileError, setFileError]       = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");

  const coutType = selectedType?.cout_tokens ?? 0;
  const coutOpts = options
    .filter((o) => selectedOpts.has(o.id))
    .reduce((s, o) => s + o.cout_tokens, 0);
  const total = coutType + coutOpts;
  const insuffisant = solde < total;

  function toggleOpt(id: string) {
    setSelectedOpts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleFile(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith(".bin")) {
      setFileError("Extension invalide — seuls les fichiers .bin sont acceptés.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileError("Fichier trop volumineux — 20 Mo maximum.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) { setError("Choisissez un type de tuning."); return; }
    if (!file)         { setError("Joignez le fichier .bin original."); return; }
    if (insuffisant)   { setError("Solde insuffisant."); return; }

    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié.");

      // Upload du fichier vers bin-original
      const uploadSlot = crypto.randomUUID();
      const storagePath = `${atelierId}/${uploadSlot}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("bin-original")
        .upload(storagePath, file, { contentType: "application/octet-stream", upsert: false });

      if (uploadError) throw new Error(`Upload : ${uploadError.message}`);

      // Création de la demande via fonction Postgres
      const { data, error: rpcError } = await supabase.rpc("creer_demande_tuning", {
        p_engine:      engineId,
        p_tuning_type: selectedType.id,
        p_options:     Array.from(selectedOpts),
        p_fichier:     storagePath,
        p_nom:         file.name,
        p_taille:      file.size,
        p_note:        note.trim() || null,
      });

      if (rpcError) throw new Error(rpcError.message);

      const result = data as { ok: boolean; code?: string; requis?: number; solde?: number; reference?: string };

      if (!result.ok) {
        if (result.code === "SOLDE_INSUFFISANT") {
          throw new Error(`Solde insuffisant — il vous manque ${(result.requis ?? 0) - (result.solde ?? 0)} token(s).`);
        }
        throw new Error("Erreur lors de la création de la demande.");
      }

      router.push(`/dashboard?ref=${result.reference}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Type de tuning */}
      <section>
        <h2 className="font-display text-xl mb-4">Type de tuning</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {tuningTypes.map((t) => {
            const active = selectedType?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(active ? null : t)}
                className={`text-left border rounded-[10px] p-3 cursor-pointer transition-[border-color,background] duration-150 ${
                  active
                    ? "border-ember bg-ember-soft"
                    : "border-line bg-card hover:border-ink2"
                }`}
              >
                <p className="text-sm font-semibold">{t.nom_fr}</p>
                <p className="text-xs text-mute mt-0.5">{t.cout_tokens} token{t.cout_tokens > 1 ? "s" : ""}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Options */}
      {options.length > 0 && (
        <section>
          <h2 className="font-display text-xl mb-1">Options</h2>
          <p className="text-ink2 text-sm mb-4">Sélection facultative, coût additionnel.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {options.filter((o) => o.cout_tokens > 0).map((o) => {
              const active = selectedOpts.has(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOpt(o.id)}
                  className={`text-left border rounded-[10px] p-3 cursor-pointer transition-[border-color,background] duration-150 ${
                    active
                      ? "border-ember bg-ember-soft"
                      : "border-line bg-card hover:border-ink2"
                  }`}
                >
                  <p className="text-sm font-semibold">{o.nom_fr}</p>
                  <p className="text-xs text-mute mt-0.5">+{o.cout_tokens} token{o.cout_tokens > 1 ? "s" : ""}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Récapitulatif du coût */}
      {selectedType && (
        <div className="bg-card border border-line rounded-[10px] p-4 shadow-card flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">
              Total : <span className="text-ink font-bold">{total} token{total > 1 ? "s" : ""}</span>
              <span className="text-mute ml-2 text-xs">
                ≈ {(total * tokenDzd).toLocaleString("fr-FR")} DZD
              </span>
            </p>
            <p className="text-xs text-mute mt-0.5">Solde actuel : {solde} token{solde > 1 ? "s" : ""}</p>
          </div>
          {insuffisant && (
            <p className="text-ember text-sm font-medium">
              Solde insuffisant — il vous manque {total - solde} token{total - solde > 1 ? "s" : ""}.{" "}
              <a href="/dashboard/recharge" style={{ color: "var(--ember)", textDecoration: "underline" }}>
                Recharger
              </a>
            </p>
          )}
        </div>
      )}

      {/* Fichier .bin */}
      <section>
        <h2 className="font-display text-xl mb-4">Fichier original (.bin)</h2>
        <div
          className="border-2 border-dashed border-line rounded-[10px] p-8 text-center cursor-pointer hover:border-ember transition-colors duration-150"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-ember"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("border-ember")}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-ember");
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
        >
          {file ? (
            <div className="space-y-1">
              <p className="font-mono text-sm font-medium text-ink">{file.name}</p>
              <p className="text-mute text-xs">{(file.size / 1024).toFixed(1)} Ko</p>
              <button
                type="button"
                className="text-xs text-ember underline mt-1"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-ink2 text-sm">Glissez votre fichier ici ou cliquez</p>
              <p className="text-mute text-xs">Format .bin uniquement — 20 Mo max</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".bin"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {fileError && <p className="text-ember text-sm mt-2">{fileError}</p>}
      </section>

      {/* Note */}
      <section>
        <h2 className="font-display text-xl mb-3">Note (facultatif)</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Informations complémentaires pour l'équipe SBFiles…"
          className="w-full bg-card border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-[border-color] duration-150 resize-none"
        />
      </section>

      {error && (
        <p className="text-ember text-sm font-medium" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedType || !file || insuffisant}
        className="w-full bg-ember text-white font-semibold text-sm px-6 py-3 rounded cursor-pointer hover:bg-ember-ink transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Envoi en cours…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
