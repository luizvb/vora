import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-950">
      <div className="flex items-center gap-3 mb-6">
        <Compass className="w-12 h-12 text-indigo-500" />
        <h1 className="text-5xl font-black tracking-tight text-white italic underline decoration-indigo-500/30 underline-offset-8">VORA</h1>
      </div>
      <p className="max-w-2xl mb-10 text-xl text-slate-400 font-medium leading-relaxed">
        The Vocal Oracle. <span className="text-slate-100">Transforming raw sales transcripts</span> into actionable coaching insights in under 60 seconds.
      </p>
      <div className="flex gap-4">
        <Link href="/onboarding">
          <Button size="lg" className="px-10 h-14 bg-white hover:bg-slate-200 text-black text-lg font-black rounded-2xl shadow-xl shadow-indigo-500/10 transition-all active:scale-95">
            Get Started
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 max-w-4xl w-full text-left">
        <div className="p-8 rounded-[32px] bg-slate-900/50 border border-slate-800/50 space-y-4 group hover:border-indigo-500/20 transition-colors">
          <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> For Reps
          </h3>
          <p className="text-slate-400 leading-relaxed">
            Identify why deals stall and get objective feedback to close more.
          </p>
        </div>
        <div className="p-8 rounded-[32px] bg-slate-900/50 border border-slate-800/50 space-y-4 group hover:border-indigo-500/20 transition-colors">
          <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> For Managers
          </h3>
          <p className="text-slate-400 leading-relaxed">
            Audit compliance and coach your team at scale without listening to every call.
          </p>
        </div>
      </div>
    </div>
  );
}
