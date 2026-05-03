"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogIn, LogOut } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { dashboardPath } from "./data";

export function SignupPage() {
  const router = useRouter();
  const {
    caasyRole,
    displayName,
    email,
    isAuthenticated,
    isAuthLoading,
    isSupabaseConfigured,
    signInWithGoogle,
    signOut,
  } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to start Google sign in.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F5F7] px-5 py-8 text-[#1A2530]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl grid-cols-[1fr_420px] items-center gap-8 max-md:grid-cols-1">
        <section>
          <div className="mb-8 font-serif text-[34px] font-semibold leading-none tracking-[-0.5px] text-[#1E4A6E]">
            CaaS<span className="relative inline-block after:absolute after:left-[58%] after:top-[-0.1em] after:block after:size-[0.18em] after:-translate-x-1/2 after:rounded-full after:bg-[#7EC8F0]">y</span>
          </div>
          <h1 className="font-display text-[56px] leading-[0.98] tracking-normal text-[#1A2530] max-md:text-4xl">
            Coaching intelligence for real sessions.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#607080]">
            Sign in with Google, run a coaching session, and keep a clean history of AI-generated reports.
          </p>
        </section>

        <section className="rounded-[13px] border border-[#E4E9ED] bg-white p-5 shadow-[0_10px_30px_rgba(26,37,48,0.08)]">
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#9AABB8]">Access</div>
            <h2 className="mt-2 font-display text-3xl text-[#1A2530]">
              {isAuthenticated ? `Welcome, ${displayName}` : "Continue to CaaSy"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#607080]">
              {isAuthenticated ? email : "Your sessions and reports are tied to your authenticated user account."}
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="rounded-[11px] border border-[#C8892A]/25 bg-[#FFF4E3] p-4 text-sm leading-6 text-[#6E4A13]">
              Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable Google sign in.
            </div>
          ) : isAuthenticated ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => router.push(dashboardPath(caasyRole, "home"))}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[9px] bg-[#1E4A6E] px-4 text-sm font-semibold text-white transition hover:bg-[#2B6CB0]"
              >
                Open dashboard <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[9px] border border-[#DCE4EA] bg-white px-4 text-sm font-semibold text-[#1E4A6E] transition hover:bg-[#F5F9FF]"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isAuthLoading || isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#1E4A6E] px-4 text-sm font-semibold text-white transition hover:bg-[#2B6CB0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="size-4" />
              {isSubmitting ? "Opening Google..." : "Continue with Google"}
            </button>
          )}

          {error ? (
            <p className="mt-3 rounded-[9px] bg-[#FDF0F0] px-3 py-2 text-xs text-[#C03030]">{error}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
