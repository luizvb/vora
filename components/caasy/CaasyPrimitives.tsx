"use client";

import { Lock, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Stat, TeamRow, ThreadCardData } from "./types";

const toneClasses = {
  up: "text-[#1D8A5E]",
  warn: "text-[#C8892A]",
  blue: "text-[#2B6CB0]",
  purple: "text-[#5B4FA0]",
};

const colorMap = {
  blue: {
    dot: "bg-[#3B8FD4]",
    soft: "bg-[#EBF4FF]",
    text: "text-[#1E4A6E]",
    bar: "bg-[#3B8FD4]",
    border: "border-[#3B8FD4]",
  },
  green: {
    dot: "bg-[#1D8A5E]",
    soft: "bg-[#E6F5EE]",
    text: "text-[#1D8A5E]",
    bar: "bg-[#1D8A5E]",
    border: "border-[#1D8A5E]",
  },
  amber: {
    dot: "bg-[#C8892A]",
    soft: "bg-[#FFF4E3]",
    text: "text-[#C8892A]",
    bar: "bg-[#C8892A]",
    border: "border-[#C8892A]",
  },
  navy: {
    dot: "bg-[#2A3E5A]",
    soft: "bg-[#EEF2FA]",
    text: "text-[#2A3E5A]",
    bar: "bg-[#2A3E5A]",
    border: "border-[#2A3E5A]",
  },
  purple: {
    dot: "bg-[#5B4FA0]",
    soft: "bg-[#EEF0FA]",
    text: "text-[#3D2F7A]",
    bar: "bg-[#5B4FA0]",
    border: "border-[#5B4FA0]",
  },
};

export function CaasyLogo({ tagline }: { tagline: string }) {
  return (
    <div>
      <div className="font-serif text-[20px] font-semibold leading-none tracking-[-0.5px] text-white">
        CaaS<span className="relative inline-block after:absolute after:left-[58%] after:top-[-0.1em] after:block after:size-[0.18em] after:-translate-x-1/2 after:rounded-full after:bg-[#7EC8F0]">y</span>
      </div>
      <div className="mt-1 text-[7px] uppercase tracking-[2.8px] text-white/40">{tagline}</div>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[10px] border border-[#E4E9ED] bg-white p-3.5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 text-[10px] font-semibold uppercase tracking-[0.9px] text-[#9AABB8]", className)}>
      {children}
    </div>
  );
}

export function StatTile({ stat, onOpen }: { stat: Stat; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "rounded-[10px] border border-[#E4E9ED] bg-white p-3 text-left transition hover:border-[#3B8FD4] hover:shadow-[0_2px_10px_rgba(59,143,212,0.1)]",
        !onOpen && "cursor-default"
      )}
    >
      <div className="font-display text-[28px] leading-none text-[#1A2530]">{stat.value}</div>
      <div className="mt-1 text-[10px] text-[#9AABB8]">{stat.label}</div>
      {stat.detail ? (
        <div className={cn("mt-1 text-[9px] font-semibold", stat.tone ? toneClasses[stat.tone] : "text-[#607080]")}>
          {stat.detail}
        </div>
      ) : null}
    </button>
  );
}

export function WelcomeBanner({
  title,
  text,
  cta,
  accent,
  onClick,
}: {
  title: string;
  text: string;
  cta: string;
  accent: "blue" | "navy" | "green" | "purple";
  onClick?: () => void;
}) {
  const gradient =
    accent === "purple"
      ? "from-[#2A1F5E] to-[#3D2F7A]"
      : accent === "green"
        ? "from-[#173D2E] to-[#1E3A52]"
        : "from-[#1E4A6E] to-[#2B6CB0]";
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4 rounded-[12px] bg-linear-to-br p-4 text-white", gradient)}>
      <div>
        <h2 className="font-display text-[20px] font-medium leading-tight">{title}</h2>
        <p className="mt-1 text-xs font-light text-white/65">{text}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-[7px] border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
      >
        {cta} →
      </button>
    </div>
  );
}

export function InsightQuote({ children, meta }: { children: React.ReactNode; meta?: string }) {
  return (
    <div>
      <div className="rounded-r-lg border-l-[3px] border-[#3B8FD4] bg-[#F5F9FF] px-4 py-3 font-display text-[13px] italic leading-[1.65] text-[#2E4050]">
        “{children}”
      </div>
      {meta ? <div className="mt-2 text-[10px] text-[#9AABB8]">{meta}</div> : null}
    </div>
  );
}

export function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: keyof typeof colorMap }) {
  const c = colorMap[color];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold", c.soft, c.text)}>{children}</span>;
}

export function ThreadCard({ thread }: { thread: ThreadCardData }) {
  const c = colorMap[thread.color];
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.07)]">
      <div className={cn("mb-3 flex size-[34px] items-center justify-center rounded-lg", c.soft)}>
        <div className={cn("size-2 rounded-full", c.dot)} />
      </div>
      <div className="text-[13px] font-semibold text-[#1A2530]">{thread.title}</div>
      <p className="mt-1 text-[11px] font-light leading-5 text-[#607080]">{thread.description}</p>
      <div className="mt-3 h-1 rounded-full bg-[#E4E9ED]">
        <div className={cn("h-full rounded-full", c.bar)} style={{ width: `${thread.progress}%` }} />
      </div>
      <div className="mt-1 text-[9px] text-[#9AABB8]">{thread.progress}% · {thread.meta}</div>
      {thread.quote ? (
        <div className={cn("mt-2 rounded-md border-l-2 px-3 py-2 text-[10px] italic leading-5 text-[#607080]", c.soft, c.border)}>
          “{thread.quote}”
        </div>
      ) : null}
    </Card>
  );
}

export function MiniLineChart({ color = "#3B8FD4" }: { color?: string }) {
  return (
    <svg viewBox="0 0 320 120" className="h-40 w-full overflow-visible">
      <path d="M10 95H310" stroke="#E4E9ED" />
      <path d="M10 65H310" stroke="#E4E9ED" />
      <path d="M10 35H310" stroke="#E4E9ED" />
      <path d="M18 86 C70 74, 88 58, 126 62 S188 38, 224 42 S272 24, 304 30" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M18 86 C70 74, 88 58, 126 62 S188 38, 224 42 S272 24, 304 30 L304 105 L18 105 Z" fill={color} opacity="0.08" />
    </svg>
  );
}

export function MiniBarChart({ color = "#3B8FD4" }: { color?: string }) {
  const values = [42, 78, 55, 92, 64];
  return (
    <div className="flex h-32 items-end gap-3 px-2">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-[#E4E9ED]">
          <div className="rounded-t-md" style={{ height: `${v}px`, backgroundColor: color }} />
        </div>
      ))}
    </div>
  );
}

export function ChatPanel({
  title = "CaaSy",
  mode,
  messages,
  placeholder = "Keep going...",
}: {
  title?: string;
  mode: string;
  messages: ChatMessage[];
  placeholder?: string;
}) {
  const [items, setItems] = useState(messages);
  const [value, setValue] = useState("");

  const send = () => {
    if (!value.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setItems((current) => [
      ...current,
      { from: "user", text: value.trim(), time },
      { from: "caasy", text: "What part of that feels like the real pattern underneath the situation?", time },
    ]);
    setValue("");
  };

  return (
    <div className="flex h-[460px] flex-col rounded-[11px] border border-[#E4E9ED] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[#E4E9ED] px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-full bg-[#1E4A6E] text-[10px] font-bold text-white">C</div>
        <div>
          <div className="text-xs font-semibold text-[#1A2530]">{title}</div>
          <div className="text-[10px] text-[#3B8FD4]">{mode}</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {items.map((msg, index) => (
          <div key={`${msg.from}-${index}`} className={cn("flex max-w-[86%] flex-col", msg.from === "user" ? "self-end items-end" : "self-start")}>
            <div
              className={cn(
                "rounded-[10px] px-3 py-2 text-xs leading-5",
                msg.from === "user"
                  ? "rounded-br-sm bg-[#1E4A6E] text-white"
                  : "rounded-bl-sm border border-[#E4E9ED] bg-[#F2F5F7] text-[#2E4050]"
              )}
            >
              {msg.text}
            </div>
            <div className="mt-0.5 px-0.5 text-[9px] text-[#9AABB8]">{msg.time}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-[#E4E9ED] p-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-[7px] border border-[#E4E9ED] bg-[#F2F5F7] px-3 py-2 text-xs outline-none focus:border-[#3B8FD4]"
        />
        <button type="button" onClick={send} className="inline-flex items-center gap-1 rounded-[7px] bg-[#1E4A6E] px-3 py-2 text-[11px] font-semibold text-white">
          <Send className="size-3" /> Send
        </button>
      </div>
    </div>
  );
}

export function ComingSoonPanel({ title = "Coming soon" }: { title?: string }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center text-center">
      <div className="mb-3 rounded-full bg-[#EBF4FF] p-3 text-[#1E4A6E]">
        <Lock className="size-5" />
      </div>
      <h2 className="font-display text-2xl text-[#1A2530]">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#607080]">
        This coaching experience is being prepared for a future release. For now, use Coach my Call or Coach Me.
      </p>
    </Card>
  );
}

export function TeamTable({ rows, label }: { rows: TeamRow[]; label: string }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle className="mb-0">{label}</CardTitle>
        <span className="text-[11px] text-[#9AABB8]">{rows.length + 4} people · {rows.length} in coaching</span>
      </div>
      <div className="grid grid-cols-[1.4fr_0.5fr_0.75fr_1.4fr] border-b border-[#E4E9ED] pb-2 text-[9px] font-semibold uppercase tracking-[0.8px] text-[#9AABB8]">
        <div>Person</div>
        <div>Sessions</div>
        <div>Readiness</div>
        <div>CaaSy signal</div>
      </div>
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[1.4fr_0.5fr_0.75fr_1.4fr] items-center border-b border-[#E4E9ED] py-3 text-xs last:border-0">
          <div>
            <div className="font-medium text-[#1A2530]">{row.name}</div>
            <div className="text-[10px] text-[#9AABB8]">{row.role}</div>
          </div>
          <div className="text-[#607080]">{row.sessions}</div>
          <div>
            <span className="rounded-md bg-[#E6F5EE] px-2 py-1 text-[9px] font-semibold text-[#1D8A5E]">{row.readiness}</span>
          </div>
          <div className="italic leading-5 text-[#607080]">{row.signal}</div>
        </div>
      ))}
    </Card>
  );
}

export function PrivacyBanner() {
  return (
    <div className="mb-3 flex gap-3 rounded-[10px] bg-[#3D2F7A] p-4 text-white">
      <Lock className="mt-0.5 size-4 shrink-0 text-white/60" />
      <p className="text-[11px] font-light leading-6 text-white/75">
        <strong className="font-semibold text-white">All data on this dashboard is anonymous and aggregated.</strong> No coaching conversation is ever shared with the organisation. No individual is identified. Patterns are only shown where 5 or more people contribute to the aggregate. CaaSy sees people, never reports them.
      </p>
    </div>
  );
}
