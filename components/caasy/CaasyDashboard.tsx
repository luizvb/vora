"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, History, LogOut, Plus, RotateCcw, Send } from "lucide-react";
import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { AgentMonitor } from "@/components/analyze/AgentMonitor";
import { CaaSyRole, normalizeRole, useUser } from "@/app/context/UserContext";
import {
  getCoachSessionMessages,
  getCoachSessions,
  saveCoachMessage,
  type CoachSessionSummary,
} from "@/lib/coach-session-service";
import { getRecentReports, type Report } from "@/lib/report-service";
import { cn } from "@/lib/utils";
import { dashboardPath, profiles } from "./data";
import {
  Card,
  CardTitle,
  CaasyLogo,
  ComingSoonPanel,
  StatTile,
  WelcomeBanner,
} from "./CaasyPrimitives";
import type { RoleProfile, ViewId } from "./types";

export function CaasyDashboard({ initialRole, initialView }: { initialRole?: string; initialView?: string }) {
  const router = useRouter();
  const {
    setRole,
    caasyRole,
    displayName,
    email,
    isAuthenticated,
    isAuthLoading,
    isSupabaseConfigured,
    signOut,
    user,
  } = useUser();
  const role = normalizeRole(initialRole || caasyRole);
  const profile = profiles[role];
  const view = normalizeView(profile, initialView);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  useEffect(() => {
    let cancelled = false;
    async function loadReports() {
      if (!user) {
        setReports([]);
        return;
      }
      const rows = await getRecentReports(20);
      if (!cancelled) setReports(rows);
    }
    loadReports();
    window.addEventListener("focus", loadReports);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadReports);
    };
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const openView = (nextView: ViewId) => {
    router.push(dashboardPath(role, nextView));
  };

  if (isAuthLoading) {
    return <CenteredState title="Loading CaaSy" text="Checking your session..." />;
  }

  if (!isSupabaseConfigured) {
    return <CenteredState title="CaaSy is not ready yet" text="The coaching workspace is missing its account connection. Please contact support." />;
  }

  if (!isAuthenticated) {
    return <CenteredState title="Sign in required" text="Redirecting to Google sign in..." />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F5F7] text-[#1A2530]">
      <Sidebar profile={profile} activeView={view} onOpen={openView} displayName={displayName} email={email} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} view={view} displayName={displayName} onSignOut={signOut} />
        <div className="hidden flex-1 overflow-y-auto p-4 md:block">
          <DashboardView role={role} profile={profile} view={view} reports={reports} onOpen={openView} />
        </div>
        <MobileChat role={role} profile={profile} />
      </main>
    </div>
  );
}

function CenteredState({ title, text }: { title: string; text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F5F7] px-6 text-center text-[#1A2530]">
      <div className="rounded-[13px] border border-[#E4E9ED] bg-white p-6 shadow-[0_10px_30px_rgba(26,37,48,0.08)]">
        <div className="font-display text-2xl text-[#1A2530]">{title}</div>
        <p className="mt-2 text-sm text-[#607080]">{text}</p>
      </div>
    </main>
  );
}

function normalizeView(profile: RoleProfile, input?: string): ViewId {
  if (input && !profile.nav.some((item) => item.id === input)) return "unknown";
  const available = new Set(profile.nav.filter((item) => item.id).map((item) => item.id));
  return available.has(input as ViewId) ? (input as ViewId) : profile.defaultView;
}

function Sidebar({
  profile,
  activeView,
  onOpen,
  displayName,
  email,
}: {
  profile: RoleProfile;
  activeView: ViewId;
  onOpen: (view: ViewId) => void;
  displayName: string;
  email: string | null;
}) {
  const sidebarColor = profile.accent === "purple" ? "bg-[#3D2F7A]" : profile.accent === "green" ? "bg-[#1E3A52]" : "bg-[#2A3E5A]";
  return (
    <aside className={cn("hidden h-screen w-[204px] shrink-0 flex-col md:flex", sidebarColor)}>
      <div className="border-b border-white/10 px-4 py-4">
        <CaasyLogo tagline={profile.tagline} />
      </div>
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold text-white">{displayName.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-white">{displayName}</div>
          <div className="truncate text-[10px] text-white/40">{email}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-px overflow-y-auto px-2 py-1.5">
        {profile.nav.map((item, index) => {
          if (item.section) {
            return <div key={`${item.section}-${index}`} className="px-2.5 pb-1 pt-3 text-[8.5px] font-semibold uppercase tracking-[1px] text-white/30">{item.section}</div>;
          }
          const Icon = item.icon!;
          const active = item.id === activeView;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onOpen(item.id!)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-xs transition",
                active ? "bg-white/15 font-medium text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-[13px] opacity-80" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-2.5">
        <div className="rounded-[7px] bg-white/10 p-2.5">
          <div className="text-[8.5px] text-white/45">{profile.footerLabel}</div>
          <div className="mt-2 flex gap-1">
            <span className="h-1 w-4 rounded-full bg-[#7EC8F0]" />
            <span className="h-1 w-4 rounded-full bg-[#7EC8F0]" />
            <span className="h-1 w-4 rounded-full bg-[#7EC8F0]" />
            <span className="h-1 w-4 rounded-full bg-white/20" />
          </div>
          <div className="mt-1 text-[9px] text-white/40">Real reports only</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ profile, view, displayName, onSignOut }: { profile: RoleProfile; view: ViewId; displayName: string; onSignOut: () => Promise<void> }) {
  const title = profile.nav.find((item) => item.id === view)?.label || "Dashboard";
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#E4E9ED] bg-white px-4 md:px-5">
      <div>
        <div className="md:hidden"><CaasyLogo tagline={profile.tagline} /></div>
        <div className="hidden text-[13px] font-semibold text-[#1A2530] md:block">{title}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", profile.accent === "purple" ? "bg-[#EEF0FA] text-[#3D2F7A]" : "bg-[#EBF4FF] text-[#1E4A6E]")}>
          {profile.pill}
        </span>
        <span className="hidden text-[11px] text-[#9AABB8] sm:inline">{displayName}</span>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1 rounded-md border border-[#DCE4EA] px-2.5 py-1 text-[10px] font-semibold text-[#607080] transition hover:bg-[#F5F9FF] hover:text-[#1E4A6E]"
        >
          <LogOut className="size-3" /> Sign out
        </button>
      </div>
    </header>
  );
}

function DashboardView({ role, profile, view, reports, onOpen }: { role: CaaSyRole; profile: RoleProfile; view: ViewId; reports: Report[]; onOpen: (view: ViewId) => void }) {
  if (view === "home") return <RoleHome profile={profile} reports={reports} onOpen={onOpen} />;
  if (view === "coach-call") return <CoachCallFlow reports={reports} />;
  if (view === "coach-me" || view === "coaching") return <CoachingView role={role} />;
  if (view === "my-sessions") return <ReportsView reports={reports} />;
  return <ComingSoonPanel />;
}

function RoleHome({ profile, reports, onOpen }: { profile: RoleProfile; reports: Report[]; onOpen: (view: ViewId) => void }) {
  const dashboardStats = buildDynamicStats(reports);
  return (
    <div className="mx-auto max-w-[1120px]">
      <WelcomeBanner
        title="Your CaaSy coaching dashboard"
        text="Your private coaching workspace for improving sales calls, preparing for difficult conversations, and turning each session into practical next steps."
        cta="Coach my Call"
        accent={profile.accent}
        onClick={() => onOpen("coach-call")}
      />
      <div className="mb-3 grid grid-cols-2 gap-3">
        <ActionCard
          title="Coach my Call"
          text="Paste a sales call transcript and get clear feedback on trust, discovery, objections, language, and next steps."
          action="Analyze a call"
          onClick={() => onOpen("coach-call")}
        />
        <ActionCard
          title="Coach Me"
          text="Bring a situation, decision, or challenge. CaaSy coaches you through it and saves the key takeaways."
          action="Start coaching"
          onClick={() => onOpen("coach-me")}
        />
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2.5">
        {dashboardStats.map((stat) => <StatTile key={stat.label} stat={stat} onOpen={stat.view ? () => onOpen(stat.view!) : undefined} />)}
      </div>
      {reports.length > 0 ? <DynamicInsights reports={reports} /> : <EmptyDashboard onOpen={onOpen} />}
      <ReportsView reports={reports} compact />
    </div>
  );
}

function buildDynamicStats(reports: Report[]) {
  if (reports.length === 0) {
    return [
      { value: "0", label: "Coaching reports", detail: "No sessions yet", tone: "blue" as const, view: "coach-call" as const },
      { value: "-", label: "Average score", detail: "Start first session", tone: "blue" as const },
      { value: "0", label: "Action items", detail: "Generated from sessions", tone: "warn" as const },
      { value: "-", label: "Latest tone", detail: "Waiting for data", tone: "blue" as const },
    ];
  }

  const latest = reports[0];
  const avgScore = Math.round(reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length);
  const actions = reports.flatMap((report) => report.actionPlan);
  return [
    { value: String(reports.length), label: "Coaching reports", detail: "Saved to your account", tone: "blue" as const, view: "my-sessions" as const },
    { value: String(avgScore), label: "Average CaaSy score", detail: `${latest.overallScore} latest`, tone: "up" as const },
    { value: String(actions.length), label: "Action items", detail: `${actions.filter((action) => action.priority === "high").length} high priority`, tone: "warn" as const },
    { value: latest.linguisticStats.tone, label: "Latest tone", detail: `${latest.linguisticStats.fillerWords} filler words`, tone: "blue" as const },
  ];
}

function ActionCard({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="min-h-[44px] text-sm leading-5 text-[#607080]">{text}</p>
      <button type="button" onClick={onClick} className="mt-3 rounded-md bg-[#1E4A6E] px-3 py-2 text-xs font-semibold text-white">
        {action}
      </button>
    </Card>
  );
}

function EmptyDashboard({ onOpen }: { onOpen: (view: ViewId) => void }) {
  return (
    <Card className="mb-3">
      <CardTitle>No coaching insights yet</CardTitle>
      <h2 className="font-display text-[22px] leading-tight text-[#1A2530]">Start your first coaching session to build a private performance history.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-5 text-[#607080]">
        Your dashboard grows from your real coaching work: sales call reviews, personal coaching sessions, action items, and progress over time.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => onOpen("coach-call")} className="rounded-md bg-[#1E4A6E] px-3 py-2 text-xs font-semibold text-white">Coach my Call</button>
        <button type="button" onClick={() => onOpen("coach-me")} className="rounded-md border border-[#DCE4EA] bg-white px-3 py-2 text-xs font-semibold text-[#1E4A6E]">Coach Me</button>
      </div>
    </Card>
  );
}

function DynamicInsights({ reports }: { reports: Report[] }) {
  const latest = reports[0];
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_292px] gap-3">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0">Latest coaching insights</CardTitle>
          <span className="text-[10px] text-[#9AABB8]">
            {new Date(latest.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.9px] text-[#1D8A5E]">What worked</div>
            {latest.pros.slice(0, 2).map((item) => (
              <InfoBlock key={item.quote} title={item.quote} text={compactText(item.analysis)} />
            ))}
          </div>
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.9px] text-[#C8892A]">What to improve</div>
            {latest.cons.slice(0, 2).map((item) => (
              <InfoBlock key={item.quote} title={item.quote} text={compactText(item.analysis)} color="amber" />
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle>Action plan</CardTitle>
        <div className="space-y-2">
          {latest.actionPlan.map((action) => (
            <InfoBlock
              key={action.title}
              title={`${action.priority.toUpperCase()} · ${action.title}`}
              text={compactText(action.description)}
              color={action.priority === "high" ? "amber" : "grey"}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReportsView({ reports, compact = false }: { reports: Report[]; compact?: boolean }) {
  if (reports.length === 0) {
    if (compact) return null;
    return (
      <div className="mx-auto max-w-[980px]">
        <EmptyDashboard onOpen={() => undefined} />
      </div>
    );
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-[1120px]"}>
      <Card>
        <CardTitle>{compact ? "Recent coaching reports" : "Reports"}</CardTitle>
        <div className={compact ? "grid grid-cols-4 gap-2" : "grid grid-cols-4 gap-2"}>
          {reports.slice(0, compact ? 6 : 20).map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => window.location.assign(`/dashboard/${report.id}`)}
              className="rounded-lg border border-[#E4E9ED] bg-[#F5F9FF] p-3 text-left transition hover:border-[#3B8FD4]"
            >
              <div className="font-display text-2xl text-[#1A2530]">{report.overallScore}</div>
              <div className="text-[10px] font-semibold text-[#2B6CB0]">{report.linguisticStats.tone}</div>
              <div className="mt-1 truncate text-[10px] text-[#607080]">{compactText(report.actionPlan[0]?.title || "AI coaching")}</div>
              <div className="mt-1 text-[9px] text-[#9AABB8]">{new Date(report.createdAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function compactText(text: string, max = 150) {
  const cleaned = text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function InfoBlock({ title, text, color = "blue" }: { title: string; text: string; color?: "blue" | "amber" | "grey" }) {
  return (
    <div className={cn("rounded-lg border p-3", color === "amber" ? "border-[#C8892A]/25 bg-[#FFF4E3]" : color === "grey" ? "border-[#E4E9ED] bg-[#F2F5F7]" : "border-[#3B8FD4]/25 bg-[#EBF4FF]")}>
      <div className="text-[13px] font-semibold text-[#1E4A6E]">{title}</div>
      <div className="text-[11px] leading-5 text-[#607080]">{text}</div>
    </div>
  );
}

type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

const COACH_WELCOME_MESSAGE: CoachMessage = {
  role: "assistant",
  content: "What do you want coaching on today? Send the real context, decision, or conversation. I will help you think it through step by step.",
};

function createSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
}

function CoachingView({ role }: { role: CaaSyRole }) {
  const router = useRouter();
  const { user } = useUser();
  const [sessionId, setSessionId] = useState(createSessionId);
  const [messages, setMessages] = useState<CoachMessage[]>([COACH_WELCOME_MESSAGE]);
  const [sessions, setSessions] = useState<CoachSessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [reportTranscript, setReportTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasUserMessages = messages.some((message) => message.role === "user");

  const refreshSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      return;
    }

    setIsLoadingSessions(true);
    try {
      setSessions(await getCoachSessions(16));
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const startNewSession = () => {
    setSessionId(createSessionId());
    setMessages([COACH_WELCOME_MESSAGE]);
    setDraft("");
    setReportTranscript("");
    setErrorMessage("");
  };

  const openSession = async (nextSessionId: string) => {
    setErrorMessage("");
    setReportTranscript("");
    const rows = await getCoachSessionMessages(nextSessionId);
    setSessionId(nextSessionId);
    setMessages(rows.length ? rows.map((row) => ({ role: row.role, content: row.content })) : [COACH_WELCOME_MESSAGE]);
  };

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    const nextMessages: CoachMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setIsSending(true);
    setErrorMessage("");
    const isFirstUserMessage = !messages.some((message) => message.role === "user");
    if (user) {
      void saveCoachMessage(user.id, sessionId, "user", trimmed, isFirstUserMessage ? { title: trimmed } : {}).then(refreshSessions);
    }

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          messages: nextMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Coaching request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as { reply?: string; error?: string };
      if (data.error) throw new Error(data.error);

      const reply = data.reply || "I could not generate coaching for that message. Try giving me a little more context.";
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      if (user) void saveCoachMessage(user.id, sessionId, "assistant", reply).then(refreshSessions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The coaching chat failed.");
    } finally {
      setIsSending(false);
    }
  };

  const generateReport = () => {
    if (!hasUserMessages) return;
    setReportTranscript(formatCoachConversationForReport(messages));
  };

  return (
    <div className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)_292px] gap-3">
      <div className="flex h-[calc(100vh-84px)] min-h-[540px] flex-col overflow-hidden rounded-[11px] border border-[#E4E9ED] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#E4E9ED] bg-[#F5F9FF] px-4 py-3">
          <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#1E4A6E] text-xs font-semibold text-white">C</div>
          <div>
            <div className="text-sm font-semibold text-[#1A2530]">Coach Me</div>
            <div className="text-[10px] text-[#607080]">Private coaching session</div>
          </div>
          </div>
          <button
            type="button"
            onClick={startNewSession}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE4EA] bg-white px-3 py-2 text-[11px] font-semibold text-[#1E4A6E] transition hover:bg-[#EBF4FF]"
          >
            <Plus className="size-3.5" /> New session
          </button>
        </div>
        {!reportTranscript ? (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F2F5F7] p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap rounded-[14px] px-4 py-2.5 text-sm leading-6",
                    message.role === "assistant"
                      ? "rounded-bl-sm border border-[#E4E9ED] bg-white text-[#2E4050]"
                      : "self-end rounded-br-sm bg-[#1E4A6E] text-white"
                  )}
                >
                  {message.content}
                </div>
              ))}
              {isSending ? (
                <div className="max-w-[120px] rounded-[14px] rounded-bl-sm border border-[#E4E9ED] bg-white px-4 py-3 text-sm leading-6 text-[#607080]">
                  Thinking...
                </div>
              ) : null}
              {errorMessage ? (
                <div className="rounded-[11px] border border-[#C03030]/20 bg-[#FDF0F0] p-3 text-sm leading-6 text-[#C03030]">
                  {errorMessage}
                </div>
              ) : null}
            </div>
            <div className="border-t border-[#E4E9ED] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#607080]">Chat freely. A report is only created when you ask for one.</p>
                <button
                  type="button"
                  onClick={generateReport}
                  disabled={!hasUserMessages || isSending}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#DCE4EA] bg-white px-3 py-2 text-[11px] font-semibold text-[#1E4A6E] transition hover:bg-[#F5F9FF] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FileText className="size-3.5" /> Generate report
                </button>
              </div>
              <div className="flex items-end gap-2 rounded-[11px] border border-[#DCE4EA] bg-[#F5F9FF] p-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Type your coaching context..."
                  className="min-h-16 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#1A2530] outline-none placeholder:text-[#9AABB8]"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!draft.trim() || isSending}
                  className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1E4A6E] text-white transition hover:bg-[#2B6CB0] disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Send coaching message"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <AgentMonitor transcript={reportTranscript} mode="coach_me" onComplete={(id) => router.push(`/dashboard/${id}`)} />
          </div>
        )}
      </div>
      <Card className="flex h-[calc(100vh-84px)] min-h-[540px] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="mb-0">Coach Me history</CardTitle>
          <History className="size-4 text-[#9AABB8]" />
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#607080]">
          Continue any saved coaching conversation. Reports stay separate until you generate one.
        </p>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
          {isLoadingSessions ? (
            <div className="rounded-lg border border-[#E4E9ED] bg-[#F5F9FF] p-3 text-xs text-[#607080]">Loading history...</div>
          ) : null}
          {!isLoadingSessions && sessions.length === 0 ? (
            <div className="rounded-lg border border-[#E4E9ED] bg-[#F5F9FF] p-3 text-xs leading-5 text-[#607080]">
              Your coaching conversations will appear here after your first message.
            </div>
          ) : null}
          {sessions.map((session) => (
            <button
              key={session.sessionId}
              type="button"
              onClick={() => openSession(session.sessionId)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition hover:border-[#3B8FD4] hover:bg-[#F5F9FF]",
                session.sessionId === sessionId ? "border-[#3B8FD4] bg-[#EBF4FF]" : "border-[#E4E9ED] bg-white"
              )}
            >
              <div className="line-clamp-2 text-xs font-semibold leading-5 text-[#1A2530]">{session.title}</div>
              <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#607080]">{compactText(session.lastMessage, 92)}</div>
              <div className="mt-2 flex items-center justify-between text-[9px] text-[#9AABB8]">
                <span>{session.messageCount} messages</span>
                <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={startNewSession}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#1E4A6E] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2B6CB0]"
        >
          <Plus className="size-3.5" /> New coaching session
        </button>
      </Card>
    </div>
  );
}

function formatCoachConversationForReport(messages: CoachMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "User" : "CaaSy"}: ${message.content}`)
    .join("\n\n");
}

function CoachCallFlow({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const callReports = reports.filter((report) => report.mode === "coach_call");
  const continueFromReport = (report: Report) => {
    setIsAnalyzing(false);
    setTranscript(report.transcript);
  };

  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="grid grid-cols-[minmax(0,1fr)_292px] gap-3">
        <Card className="min-h-[calc(100vh-84px)]">
          <CardTitle>Coach my Call</CardTitle>
          {!isAnalyzing ? (
            <>
              <h1 className="font-display text-[28px] leading-tight text-[#1A2530]">Improve your next sales call.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#607080]">Paste a sales call transcript or continue from a saved call. CaaSy highlights what worked, what needs improvement, and what to do next.</p>
              <div className="mt-4">
                <AnalyzeForm
                  initialTranscript={transcript}
                  onAnalyze={(nextTranscript) => { setTranscript(nextTranscript); setIsAnalyzing(true); }}
                />
              </div>
            </>
          ) : (
            <AgentMonitor transcript={transcript} mode="coach_call" onComplete={(id) => router.push(`/dashboard/${id}`)} />
          )}
        </Card>
        <Card className="flex h-[calc(100vh-84px)] min-h-[540px] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="mb-0">Call history</CardTitle>
            <History className="size-4 text-[#9AABB8]" />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#607080]">
            Review saved call reports or continue by reusing the original transcript.
          </p>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {callReports.length === 0 ? (
              <div className="rounded-lg border border-[#E4E9ED] bg-[#F5F9FF] p-3 text-xs leading-5 text-[#607080]">
                Completed call reports will appear here after your first analysis.
              </div>
            ) : null}
            {callReports.map((report) => (
              <div key={report.id} className="rounded-lg border border-[#E4E9ED] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[#1A2530]">{report.overallScore} score</div>
                    <div className="mt-1 text-[10px] text-[#607080]">{report.linguisticStats.tone}</div>
                  </div>
                  <span className="text-[9px] text-[#9AABB8]">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#607080]">
                  {compactText(report.actionPlan[0]?.title || report.transcript, 92)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/${report.id}`)}
                    className="rounded-md border border-[#DCE4EA] bg-white px-2 py-2 text-[10px] font-semibold text-[#1E4A6E] transition hover:bg-[#F5F9FF]"
                  >
                    Open report
                  </button>
                  <button
                    type="button"
                    onClick={() => continueFromReport(report)}
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-[#1E4A6E] px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-[#2B6CB0]"
                  >
                    <RotateCcw className="size-3" /> Continue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MobileChat({ role, profile }: { role: CaaSyRole; profile: RoleProfile }) {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col overflow-hidden p-3 md:hidden">
      <div className="mb-3 rounded-xl bg-white p-3 text-sm text-[#607080] shadow-xs">
        <strong className="text-[#1A2530]">{profile.pill}</strong> · Sales and personal coaching.
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={() => router.push(dashboardPath(role, "coach-call"))} className="rounded-[11px] bg-[#1E4A6E] p-4 text-left text-white">
          <div className="text-sm font-semibold">Coach my Call</div>
          <div className="mt-1 text-xs text-white/65">Review a sales conversation.</div>
        </button>
        <button type="button" onClick={() => router.push(dashboardPath(role, "coach-me"))} className="rounded-[11px] border border-[#E4E9ED] bg-white p-4 text-left text-[#1A2530]">
          <div className="text-sm font-semibold">Coach Me</div>
          <div className="mt-1 text-xs text-[#607080]">Talk through a challenge privately.</div>
        </button>
      </div>
    </div>
  );
}
