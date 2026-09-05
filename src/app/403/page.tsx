export const metadata = { title: "403 — Accès refusé" };

export default function Page403() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
      <p className="font-display text-[80px] leading-none text-mute mb-3">403</p>
      <p className="text-xl text-ink2 mb-8">Accès refusé.</p>
      <a
        href="/"
        className="text-sm text-ember font-medium hover:underline"
      >
        ← Retour à l&apos;accueil
      </a>
    </div>
  );
}
