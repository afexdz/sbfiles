"use server";

import { headers } from "next/headers";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function logLoginAttempt({
  email,
  profileId,
  reussi,
}: {
  email:     string;
  profileId: string | null;
  reussi:    boolean;
}): Promise<void> {
  try {
    const h         = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip        = forwarded ? forwarded.split(",")[0].trim() : (h.get("x-real-ip") ?? null);
    const userAgent = h.get("user-agent") ?? null;

    const admin = createAdminClient();
    await admin.from("login_attempts").insert({
      email,
      profile_id: profileId ?? null,
      ip,
      user_agent: userAgent,
      reussi,
    });
  } catch {
    // Logging must never block the authentication flow
  }
}
