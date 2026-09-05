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
                httpOnly: true,
                secure:   process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                maxAge:   SESSION_MAX_AGE,
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
