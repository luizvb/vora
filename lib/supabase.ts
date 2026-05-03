import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseConfig() {
  if (isE2EAuthEnabled()) {
    return {
      url: "http://localhost:54321",
      anonKey: "e2e-anon-key",
      isConfigured: true,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

export function isE2EAuthEnabled() {
  return process.env.NEXT_PUBLIC_E2E_AUTH === "1";
}

export function getAppOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");

  if (typeof window !== "undefined") return window.location.origin;

  return "http://localhost:3000";
}

export function getE2EUser(): User {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    app_metadata: {},
    user_metadata: {
      full_name: "E2E User",
      name: "E2E User",
    },
    aud: "authenticated",
    created_at: "2026-05-03T00:00:00.000Z",
    email: "e2e.user@example.com",
  } as User;
}

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;
  if (isE2EAuthEnabled()) return null;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured || !url || !anonKey) return null;

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }

  return browserClient;
}

export function getUserDisplayName(user: User | null) {
  if (!user) return "CaaSy user";

  const metadata = user.user_metadata || {};
  const name =
    typeof metadata.full_name === "string" ? metadata.full_name :
    typeof metadata.name === "string" ? metadata.name :
    typeof metadata.preferred_username === "string" ? metadata.preferred_username :
    user.email?.split("@")[0];

  return name || "CaaSy user";
}
