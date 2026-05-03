"use client";

import { use, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CaasyLogo, InsightQuote } from "@/components/caasy/CaasyPrimitives";
import { getReportById, Report } from "@/lib/report-service";
import { useUser } from "@/app/context/UserContext";

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useUser();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    async function load() {
      try {
        setReport(await getReportById(id));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isAuthenticated, isAuthLoading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F2F5F7] text-[#607080]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-[#DCE4EA] border-t-[#3B8FD4]" />
          <p className="text-xs font-semibold uppercase tracking-[1.6px]">Loading CaaSy report</p>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F2F5F7] p-6">
        <Card className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-[#C03030]" />
          <h1 className="font-display text-3xl">Report not found</h1>
          <p className="mt-2 text-sm text-[#607080]">We could not find report {id}.</p>
          <Button onClick={() => router.push("/dashboard?role=individual&view=home")} className="mt-6 bg-[#1E4A6E] text-white">
            <ArrowLeft className="mr-2 size-4" /> Back to CaaSy
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F5F7]">
      <header className="flex h-[52px] items-center justify-between border-b border-[#E4E9ED] bg-white px-6">
        <div className="rounded-md bg-[#1E4A6E] px-3 py-2"><CaasyLogo tagline="Sales & Personal Coach" /></div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EBF4FF] px-2.5 py-1 text-[10px] font-semibold text-[#1E4A6E]">{report.mode === "coach_me" ? "Coaching Session" : "Call Report"}</span>
          <span className="text-[11px] text-[#9AABB8]">CaaSy</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1080px] space-y-3 p-5">
        <div className="grid grid-cols-[1fr_260px] gap-3">
          <Card className="bg-linear-to-br from-[#1E4A6E] to-[#2B6CB0] text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[1px]">Coaching complete</div>
                <h1 className="font-display text-4xl leading-tight">{report.mode === "coach_me" ? "CaaSy Personal Coaching Report" : "CaaSy Sales Call Coaching Report"}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">{report.actionPlan[0]?.description || "This report turns your coaching session into clear next steps."}</p>
              </div>
              <div className="rounded-[18px] border border-white/15 bg-white/10 p-5 text-center">
                <div className="font-display text-6xl leading-none">{report.overallScore}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55">Score</div>
              </div>
            </div>
          </Card>
          <Card>
            <CardTitle>Actions</CardTitle>
            <Button onClick={() => router.push(`/dashboard?role=individual&view=${report.mode === "coach_me" ? "coach-me" : "coach-call"}`)} className="mb-2 w-full bg-[#1E4A6E] text-white">
              <ArrowLeft className="mr-2 size-4" /> New session
            </Button>
            <Button disabled variant="outline" className="w-full">
              <Download className="mr-2 size-4" /> PDF coming soon
            </Button>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric title="Filler words" value={String(report.linguisticStats.fillerWords)} detail="From this saved session" />
          <Metric title="Tone analysis" value={report.linguisticStats.tone} detail="Based on this coaching session" />
          <Metric title="Talk ratio" value={`${report.linguisticStats.talkTime}% / ${100 - report.linguisticStats.talkTime}%`} detail="Speaker balance estimate" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardTitle>Winning moments</CardTitle>
            <div className="space-y-4">
              {report.pros.map((pro, index) => (
                <div key={index} className="rounded-lg border border-[#1D8A5E]/15 bg-[#E6F5EE]/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#1D8A5E]"><CheckCircle2 className="size-4" /> Insight</div>
                  <InsightQuote>{pro.quote}</InsightQuote>
                  <p className="mt-3 text-sm leading-6 text-[#607080]">{pro.analysis}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>Growth areas</CardTitle>
            <div className="space-y-4">
              {report.cons.map((con, index) => (
                <div key={index} className="rounded-lg border border-[#3B8FD4]/15 bg-[#EBF4FF]/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#1E4A6E]"><Target className="size-4" /> Focus needed</div>
                  <InsightQuote>{con.quote}</InsightQuote>
                  <p className="mt-3 text-sm leading-6 text-[#607080]">{con.analysis}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle>Action plan</CardTitle>
          <div className="grid grid-cols-3 gap-3">
            {report.actionPlan.map((action, index) => (
              <div key={action.title} className="relative rounded-lg border border-[#E4E9ED] bg-[#F5F9FF] p-4">
                <div className="mb-2 font-display text-4xl text-[#3B8FD4]/25">0{index + 1}</div>
                <div className="pr-16 text-sm font-semibold text-[#1A2530]">{action.title}</div>
                <p className="mt-2 text-xs leading-5 text-[#607080]">{action.description}</p>
                <span className="absolute right-3 top-3 rounded bg-[#FFF4E3] px-2 py-1 text-[9px] font-bold uppercase text-[#C8892A]">{action.priority}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Session input</CardTitle>
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#E4E9ED] bg-[#F5F9FF] p-4 text-xs leading-6 text-[#607080]">{report.transcript}</p>
        </Card>
      </div>
    </main>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <div className="text-[10px] font-semibold uppercase tracking-[0.9px] text-[#9AABB8]">{title}</div>
      <div className="mt-2 font-display text-3xl text-[#1A2530]">{value}</div>
      <div className="mt-1 text-[10px] font-semibold text-[#2B6CB0]">{detail}</div>
    </Card>
  );
}
