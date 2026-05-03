import {
  Clock3,
  Home,
  MessageSquare,
  Phone,
} from "lucide-react";
import type { CaaSyRole } from "@/app/context/UserContext";
import type { RoleProfile } from "./types";

export const dashboardPath = (role: CaaSyRole, view = "home") =>
  `/dashboard?role=${role}&view=${view}`;

const mvpNav: RoleProfile["nav"] = [
  { section: "CaaSy Coaching" },
  { id: "home", label: "Dashboard", icon: Home },
  { id: "coach-call", label: "Coach my Call", icon: Phone },
  { id: "coach-me", label: "Coach Me", icon: MessageSquare },
  { id: "my-sessions", label: "Reports", icon: Clock3 },
];

export const profiles: Record<CaaSyRole, RoleProfile> = {
  individual: {
    role: "individual",
    pill: "Coach as a Service",
    tagline: "Sales & Personal Coach",
    accent: "navy",
    defaultView: "home",
    footerLabel: "Coaching progress",
    nav: mvpNav,
  },
  sales: {
    role: "sales",
    pill: "Coach as a Service",
    tagline: "Sales & Personal Coach",
    accent: "navy",
    defaultView: "home",
    footerLabel: "Coaching progress",
    nav: mvpNav,
  },
  sales_manager: {
    role: "sales_manager",
    pill: "Coach as a Service",
    tagline: "Sales & Personal Coach",
    accent: "navy",
    defaultView: "home",
    footerLabel: "Coaching progress",
    nav: mvpNav,
  },
  people_manager: {
    role: "people_manager",
    pill: "Coach as a Service",
    tagline: "Sales & Personal Coach",
    accent: "navy",
    defaultView: "home",
    footerLabel: "Coaching progress",
    nav: mvpNav,
  },
  executive: {
    role: "executive",
    pill: "Coach as a Service",
    tagline: "Sales & Personal Coach",
    accent: "navy",
    defaultView: "home",
    footerLabel: "Coaching progress",
    nav: mvpNav,
  },
  hr: {
    role: "hr",
    pill: "Coach as a Service",
    tagline: "Sales & Personal Coach",
    accent: "navy",
    defaultView: "home",
    footerLabel: "Coaching progress",
    nav: mvpNav,
  },
};
