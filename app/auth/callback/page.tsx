"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, getSupabaseConfig } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isConfigured } = getSupabaseConfig();
  const [message, setMessage] = useState(isConfigured ? "Completing sign in..." : "CaaSy is not ready to sign you in yet.");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = searchParams.get("code");
    const authError = searchParams.get("error_description") || hashParams.get("error_description");

    if (!supabase) {
      return;
    }

    async function finishSignIn() {
      if (authError) {
        setMessage(authError);
        return;
      }

      if (code) {
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase!.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setMessage(error.message);
            return;
          }
        }
      }

      const session = await waitForSession();
      if (!session) {
        setMessage("We could not complete your sign in. Please return to CaaSy and try Google sign in again.");
        return;
      }

      router.replace("/dashboard?role=individual&view=home");
    }

    finishSignIn();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F5F7] px-6 text-[#1A2530]">
      <div className="rounded-[13px] border border-[#E4E9ED] bg-white p-6 text-center shadow-[0_10px_30px_rgba(26,37,48,0.08)]">
        <div className="font-serif text-2xl font-semibold text-[#1E4A6E]">CaaSy</div>
        <p className="mt-3 text-sm text-[#607080]">{message}</p>
      </div>
    </main>
  );
}

async function waitForSession() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return null;
}
