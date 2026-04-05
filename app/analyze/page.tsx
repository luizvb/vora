'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyzeForm } from '@/components/analyze/AnalyzeForm';
import { AgentMonitor } from '@/components/analyze/AgentMonitor';
import { useUser } from '@/app/context/UserContext';

import { createReport } from '@/lib/report-service';

export default function AnalyzePage() {
  const router = useRouter();
  const { role } = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const handleAnalyze = async (transcript: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          userId: 'user_007', // In a real app, from auth
          tenantId: 'tenant_default',
          sessionId: crypto.randomUUID()
        })
      });
      
      const data = await response.json();
      
      // Store the report in the local pglite DB via report-service
      // (The API already returns the aggregated structure)
      const id = await createReport("user_007", role, transcript, data);
      setReportId(id);
    } catch (error) {
      console.error("Analysis failed:", error);
      // Fallback to simulation if needed or show error
      setReportId("error");
    }
  };

  const handleComplete = () => {
    if (reportId) {
      router.push(`/dashboard/${reportId}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 bg-slate-950">
      <div className="w-full max-w-4xl space-y-12">
        {!isAnalyzing ? (
          <>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-2">
                Phase 2: Agent Monitor
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
                VORA <span className="text-indigo-500">Analyze</span>
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto">
                Upload or paste your sales transcript. Our agents will scan it for insights, closing signals, and tailored strategy.
              </p>
            </div>
            <AnalyzeForm onAnalyze={handleAnalyze} />
          </>
        ) : (
          <>
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl font-bold text-white">Processing Transcript...</h1>
              <p className="text-slate-400">Our specialized agents are working on your analysis.</p>
            </div>
            <AgentMonitor onComplete={handleComplete} />
          </>
        )}
      </div>
    </main>
  );
}
