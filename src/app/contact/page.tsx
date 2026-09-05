"use client";

import { useState } from "react";
import { Header }   from "@/components/layout/Header";
import { Footer }   from "@/components/layout/Footer";

const WRAP = "max-w-[900px] mx-auto px-[clamp(18px,4.5vw,48px)]";
const INPUT =
  "w-full border border-line rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/10 transition bg-white";

const SUBJECTS = [
  "Demande technique",
  "Problème avec une commande",
  "Inscription / compte atelier",
  "Recharge de tokens",
  "Partenariat",
  "Autre",
];

export default function ContactPage() {
  const [nom, setNom]       = useState("");
  const [email, setEmail]   = useState("");
  const [objet, setObjet]   = useState("");
  const [msg, setMsg]       = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay — replace with actual API call if needed
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className={`${WRAP} py-20 text-center space-y-4`}>
            <div className="text-5xl">✅</div>
            <h1 className="font-display text-2xl">Message envoyé !</h1>
            <p className="text-ink2 text-sm max-w-sm mx-auto">
              Merci <strong>{nom}</strong>. Notre équipe vous répondra sur{" "}
              <strong>{email}</strong> sous 24 h ouvrées.
            </p>
            <button
              onClick={() => { setSent(false); setNom(""); setEmail(""); setObjet(""); setMsg(""); }}
              className="inline-block text-sm text-ember hover:underline font-medium cursor-pointer"
            >
              Envoyer un autre message
            </button>
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

        {/* Hero */}
        <section className="border-b border-line bg-card">
          <div className={`${WRAP} py-12 sm:py-16`}>
            <p className="text-ember text-xs font-semibold uppercase tracking-widest mb-3">
              Contact
            </p>
            <h1 className="font-display text-[clamp(30px,4.5vw,52px)] leading-[1.05]">
              On vous répond sous 24 h
            </h1>
            <p className="text-ink2 text-[15px] mt-4 max-w-[50ch]">
              Pour toute question technique, demande de devis ou problème de compte,
              utilisez ce formulaire. Pour les urgences, contactez-nous directement sur WhatsApp.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className={WRAP}>
            <div className="grid md:grid-cols-[1fr_300px] gap-10">

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Nom complet <span className="text-ember">*</span>
                    </label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      placeholder="Votre nom"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      E-mail <span className="text-ember">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="vous@exemple.com"
                      className={INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Objet <span className="text-ember">*</span>
                  </label>
                  <select
                    value={objet}
                    onChange={(e) => setObjet(e.target.value)}
                    required
                    className={INPUT}
                  >
                    <option value="">— Sélectionnez —</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Message <span className="text-ember">*</span>
                  </label>
                  <textarea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    required
                    rows={6}
                    placeholder="Décrivez votre demande en détail…"
                    className={`${INPUT} resize-y min-h-[120px]`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-ember text-white font-semibold text-sm px-7 py-3 rounded-[10px] hover:bg-ember-ink transition-colors duration-150 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Envoi…" : "Envoyer le message"}
                </button>
              </form>

              {/* Infos de contact */}
              <aside className="space-y-4">
                <div className="bg-card border border-line rounded-[14px] p-5 shadow-card">
                  <h3 className="font-display text-[17px] mb-4">Coordonnées</h3>
                  <div className="space-y-4 text-sm">
                    <ContactItem
                      icon="📧"
                      label="E-mail"
                      value="contact@sbfiles.dz"
                      href="mailto:contact@sbfiles.dz"
                    />
                    <ContactItem
                      icon="💬"
                      label="WhatsApp"
                      value="+213 XX XX XX XX"
                      href="https://wa.me/213XXXXXXXXX"
                    />
                    <ContactItem
                      icon="🕐"
                      label="Horaires"
                      value="Sam – Jeu, 9 h – 18 h"
                    />
                  </div>
                </div>

                <div className="bg-ember-soft border border-ember/20 rounded-[14px] p-5 text-sm">
                  <p className="font-semibold text-ember-ink mb-1">Urgence technique ?</p>
                  <p className="text-ink2">
                    Pour les demandes urgentes concernant un fichier en cours de traitement,
                    contactez-nous directement sur WhatsApp en indiquant votre référence de demande.
                  </p>
                </div>
              </aside>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-mute mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="font-medium text-ember hover:underline">
            {value}
          </a>
        ) : (
          <p className="font-medium text-ink">{value}</p>
        )}
      </div>
    </div>
  );
}
