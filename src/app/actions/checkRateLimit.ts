"use server";

import { createAdminClient } from "../../../lib/supabase/admin";

const WINDOW_MS   = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 5;

/**
 * Returns whether this email is temporarily blocked due to repeated failures.
 * Reads login_attempts inserted by logLoginAttempt — no IP needed on the
 * caller side because we aggregate across all IPs for a given email.
 */
export async function checkLoginRateLimit(
  email: string,
): Promise<{ blocked: boolean; waitMinutes: number }> {
  try {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const admin = createAdminClient();

    const { count } = await admin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", email.toLowerCase().trim())
      .eq("reussi", false)
      .gte("created_at", since);

    if ((count ?? 0) >= MAX_FAILURES) {
      return { blocked: true, waitMinutes: 15 };
    }
    return { blocked: false, waitMinutes: 0 };
  } catch {
    // Fail open: don't block users if rate-limit check itself errors
    return { blocked: false, waitMinutes: 0 };
  }
}
