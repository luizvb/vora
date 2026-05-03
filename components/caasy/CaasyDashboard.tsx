"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Send } from "lucide-react";
import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { AgentMonitor } from "@/components/analyze/AgentMonitor";
import { CaaSyRole, normalizeRole, useUser } from "@/app/context/UserContext";
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
        <div className="hidden flex-1 overflow-y-auto p-5 md:block">
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
    <aside className={cn("hidden h-screen w-[212px] shrink-0 flex-col md:flex", sidebarColor)}>
      <div className="border-b border-white/10 px-4 py-5">
        <CaasyLogo tagline={profile.tagline} />
      </div>
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold text-white">{displayName.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-white">{displayName}</div>
          <div className="truncate text-[10px] text-white/40">{email}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-px overflow-y-auto px-2 py-2">
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
                "flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-xs transition",
                active ? "bg-white/15 font-medium text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-[13px] opacity-80" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="rounded-[7px] bg-white/10 p-3">
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
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#E4E9ED] bg-white px-5 md:px-6">
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
  if (view === "coach-call") return <CoachCallFlow />;
  if (view === "coach-me" || view === "coaching") return <CoachingView role={role} />;
  if (view === "my-sessions") return <ReportsView reports={reports} />;
  return <ComingSoonPanel />;
}

function RoleHome({ profile, reports, onOpen }: { profile: RoleProfile; reports: Report[]; onOpen: (view: ViewId) => void }) {
  const dashboardStats = buildDynamicStats(reports);
  return (
    <div className="mx-auto max-w-[980px]">
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
      <p className="min-h-[52px] text-sm leading-6 text-[#607080]">{text}</p>
      <button type="button" onClick={onClick} className="mt-4 rounded-md bg-[#1E4A6E] px-3 py-2 text-xs font-semibold text-white">
        {action}
      </button>
    </Card>
  );
}

function EmptyDashboard({ onOpen }: { onOpen: (view: ViewId) => void }) {
  return (
    <Card className="mb-3">
      <CardTitle>No coaching insights yet</CardTitle>
      <h2 className="font-display text-2xl text-[#1A2530]">Start your first coaching session to build a private performance history.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607080]">
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
    <div className="mb-3 grid grid-cols-[1fr_320px] gap-3">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0">Latest coaching insights</CardTitle>
          <span className="text-[10px] text-[#9AABB8]">
            {new Date(latest.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
    <div className={compact ? "" : "mx-auto max-w-[980px]"}>
      <Card>
        <CardTitle>{compact ? "Recent coaching reports" : "Reports"}</CardTitle>
        <div className="grid grid-cols-3 gap-2">
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

function CoachingView({ role }: { role: CaaSyRole }) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState("");

  const startSession = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setContext(`Coach Me request for role ${role}:\n\n${trimmed}`);
    setIsAnalyzing(true);
  };

  return (
    <div className="mx-auto grid max-w-[980px] grid-cols-[1fr_300px] gap-3">
      <div className="flex h-[calc(100vh-118px)] min-h-[560px] flex-col overflow-hidden rounded-[11px] border border-[#E4E9ED] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E4E9ED] bg-[#F5F9FF] px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#1E4A6E] text-xs font-semibold text-white">C</div>
          <div>
            <div className="text-sm font-semibold text-[#1A2530]">Coach Me</div>
            <div className="text-[10px] text-[#607080]">Private coaching session</div>
          </div>
        </div>
        {!isAnalyzing ? (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F2F5F7] p-4">
              <div className="max-w-[78%] rounded-[14px] rounded-bl-sm border border-[#E4E9ED] bg-white px-4 py-3 text-sm leading-6 text-[#2E4050]">
                What do you want coaching on today? Send the real context, decision, or conversation. I will turn it into a saved coaching report.
              </div>
              {draft.trim() ? (
                <div className="max-w-[78%] self-end whitespace-pre-wrap rounded-[14px] rounded-br-sm bg-[#1E4A6E] px-4 py-3 text-sm leading-6 text-white">
                  {draft}
                </div>
              ) : null}
            </div>
            <div className="border-t border-[#E4E9ED] bg-white p-3">
              <div className="flex items-end gap-2 rounded-[11px] border border-[#DCE4EA] bg-[#F5F9FF] p-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) startSession();
                  }}
                  placeholder="Type your coaching context..."
                  className="min-h-20 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#1A2530] outline-none placeholder:text-[#9AABB8]"
                />
                <button
                  type="button"
                  onClick={startSession}
                  disabled={!draft.trim()}
                  className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1E4A6E] text-white transition hover:bg-[#2B6CB0] disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Start coaching session"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <AgentMonitor transcript={context} mode="coach_me" onComplete={(id) => router.push(`/dashboard/${id}`)} />
          </div>
        )}
      </div>
      <Card>
        <CardTitle>Your coaching flow</CardTitle>
        <div className="space-y-2">
          <InfoBlock title="Personalized coaching" text="CaaSy reviews the context, finds patterns, and turns them into focused coaching guidance." />
          <InfoBlock title="The next step" text="Every completed session creates a report you can revisit from your dashboard." color="grey" />
        </div>
      </Card>
    </div>
  );
}

function CoachCallFlow() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  return (
    <div className="mx-auto max-w-[980px]">
      <div className="mb-3 grid grid-cols-[1fr_310px] gap-3">
        <Card>
          <CardTitle>Coach my Call</CardTitle>
          {!isAnalyzing ? (
            <>
              <h1 className="font-display text-3xl text-[#1A2530]">Improve your next sales call.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#607080]">Paste a sales call transcript. CaaSy highlights what worked, what needs improvement, and the next actions to take.</p>
              <div className="mt-5">
                <AnalyzeForm onAnalyze={(nextTranscript) => { setTranscript(nextTranscript); setIsAnalyzing(true); }} />
              </div>
            </>
          ) : (
            <AgentMonitor transcript={transcript} mode="coach_call" onComplete={(id) => router.push(`/dashboard/${id}`)} />
          )}
        </Card>
        <Card>
          <CardTitle>Sales coaching flow</CardTitle>
          <div className="space-y-2">
            <InfoBlock title="Call review" text="CaaSy reviews the conversation and highlights what helped, what blocked progress, and what to do next." />
            <InfoBlock title="Report history" text="Completed reports are saved to your private history." color="grey" />
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
