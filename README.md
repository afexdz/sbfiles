# SbFiles — Plateforme de tuning moteur

## OAuth Setup

For Google OAuth and email magic links, configure the following redirect URLs:

### Supabase — Auth > URL Configuration
- **Site URL**: `https://your-domain.com`
- **Redirect URLs** (add all):
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`
  - `https://*.vercel.app/auth/callback`
  - `https://your-domain.com/reinitialiser-mot-de-passe`
  - `http://localhost:3000/reinitialiser-mot-de-passe`

### Réinitialisation de mot de passe

Lors d'un appel à `supabase.auth.resetPasswordForEmail()`, passez le `redirectTo`
pointant vers la page dédiée :

```ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
})
```

Supabase appendra le token de recovery sous forme de fragment URL :
`/reinitialiser-mot-de-passe#access_token=...&type=recovery`

Le client Supabase (`detectSessionInUrl: true`) détecte automatiquement ce
fragment, établit la session et émet l'événement `PASSWORD_RECOVERY` que la
page consomme pour afficher le formulaire de saisie du nouveau mot de passe.

> **Important** : sans `https://your-domain.com/reinitialiser-mot-de-passe`
> dans les Redirect URLs autorisées, Supabase refusera de rediriger vers cette
> page (erreur « redirect_uri_mismatch »).

### Google Cloud Console — Credentials > OAuth 2.0
Under **Authorized redirect URIs** add:
- `https://<your-supabase-project>.supabase.co/auth/v1/callback`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
