"use server";

// ── Email utility ──────────────────────────────────────────────────────────────
// Intégration Resend (https://resend.com).
// Pour activer l'envoi réel :
//   1. Créer un compte Resend et vérifier votre domaine.
//   2. Ajouter dans .env.local :
//        RESEND_API_KEY=re_xxxxxxxxxxxx
//        EMAIL_FROM=SBFiles <noreply@votre-domaine.dz>
//        NEXT_PUBLIC_SITE_URL=https://votre-domaine.dz
//   3. Sans RESEND_API_KEY, les appels sont silencieusement ignorés (log console).
// ──────────────────────────────────────────────────────────────────────────────

const FROM_DEFAULT = "SBFiles <noreply@sbfiles.dz>";

export async function sendAtelierApprouveEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY non configuré — email d'approbation non envoyé à ${to}`);
    return;
  }

  const from    = process.env.EMAIL_FROM    ?? FROM_DEFAULT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      <h1 style="font-size:24px;margin:0 0 12px">Votre compte atelier est approuvé ✓</h1>
      <p style="color:#555;margin:0 0 24px;line-height:1.6">
        Félicitations ! Votre demande d'inscription sur <strong>SBFiles</strong> a été validée par notre équipe.
        Vous pouvez maintenant vous connecter et soumettre vos demandes de reprogrammation moteur.
      </p>
      <a href="${siteUrl}/connexion"
         style="display:inline-block;background:#E85D26;color:#fff;font-weight:600;font-size:14px;
                padding:12px 28px;border-radius:8px;text-decoration:none">
        Accéder à mon espace atelier →
      </a>
      <p style="color:#aaa;font-size:12px;margin-top:40px;border-top:1px solid #eee;padding-top:16px">
        Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Votre compte atelier SBFiles est approuvé ✓",
        html,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}:`, await res.text());
    }
  } catch (err) {
    console.error("[email] Erreur d'envoi:", err);
  }
}
