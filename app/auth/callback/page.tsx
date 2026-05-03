"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, getSupabaseConfig } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isConfigured } = getSupabaseConfig();
  const [message, setMessage] = useState(isConfigured ? "Completing sign in..." : "Supabase is not configured.");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const code = new URLSearchParams(window.location.search).get("code");

    if (!supabase) {
      return;
    }

    async function finishSignIn() {
      if (code) {
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
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
