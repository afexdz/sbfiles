import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 30 days — matches typical Supabase refresh token expiry.
// To extend further, also update Auth > Settings in the Supabase dashboard
// (JWT expiry and refresh token rotation window).
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                secure:  process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                maxAge:  SESSION_MAX_AGE,
              })
            )
          } catch {
            // Server Component — mutations ignored (read-only render path)
          }
        },
      },
    }
  )
}

/**
 * Server-action variant — reads the session from cookies but never writes back.
 *
 * Why: In Next.js 16, any cookie mutation inside a Server Action automatically
 * triggers a full route re-render.  The Supabase client calls setAll() whenever
 * it refreshes the access token, which sets a cookie, which triggers the re-render,
 * which re-runs the layout's auth check.  If that check loses the race (network
 * hiccup, auth server latency) it redirects to /403 — even though the action
 * itself succeeded.
 *
 * The middleware already handles token refresh on every request, so by the time
 * a Server Action runs the session is already fresh.  Suppressing setAll here
 * prevents the spurious re-render without affecting auth correctness.
 */
export async function createActionClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* intentional noop — see JSDoc above */ },
      },
    }
  )
}
