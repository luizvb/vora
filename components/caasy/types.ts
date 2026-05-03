import type { LucideIcon } from "lucide-react";
import type { CaaSyRole } from "@/app/context/UserContext";

export type ViewId =
  | "home"
  | "coaching"
  | "coach-me"
  | "coach-call"
  | "coach-conv"
  | "coach-deal"
  | "profile-buyer"
  | "my-deals"
  | "sessions"
  | "my-sessions"
  | "focus"
  | "stakeholders"
  | "team"
  | "one-to-one"
  | "pipeline"
  | "progress"
  | "tracks"
  | "gaps"
  | "heatmap"
  | "ld"
  | "roi"
  | "spider"
  | "report"
  | "unknown";

export interface NavItem {
  section?: string;
  id?: ViewId;
  label?: string;
  icon?: LucideIcon;
}

export interface RoleProfile {
  role: CaaSyRole;
  pill: string;
  tagline: string;
  accent: "blue" | "navy" | "green" | "purple";
  defaultView: ViewId;
  nav: NavItem[];
  footerLabel: string;
}

export interface Stat {
  value: string;
  label: string;
  detail?: string;
  tone?: "up" | "warn" | "blue" | "purple";
  view?: ViewId;
}

export interface ThreadCardData {
  title: string;
  description: string;
  progress: number;
  meta: string;
  quote?: string;
  color: "blue" | "green" | "amber" | "navy" | "purple";
}

export interface ChatMessage {
  from: "caasy" | "user";
  text: string;
  time?: string;
}

export interface TeamRow {
  name: string;
  role: string;
  sessions: string;
  readiness: string;
  signal: string;
}
