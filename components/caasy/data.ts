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
  { section: "CaaSy MVP" },
  { id: "home", label: "Dashboard", icon: Home },
  { id: "coach-call", label: "Coach my Call", icon: Phone },
  { id: "coach-me", label: "Coach Me", icon: MessageSquare },
  { id: "my-sessions", label: "Reports", icon: Clock3 },
];

export const profiles: Record<CaaSyRole, RoleProfile> = {
  individual: {
    role: "individual",
    pill: "CaaSy MVP",
    tagline: "Coaching Intelligence",
    accent: "navy",
    defaultView: "home",
    footerLabel: "MVP status",
    nav: mvpNav,
  },
  sales: {
    role: "sales",
    pill: "CaaSy MVP",
    tagline: "Coaching Intelligence",
    accent: "navy",
    defaultView: "home",
    footerLabel: "MVP status",
    nav: mvpNav,
  },
  sales_manager: {
    role: "sales_manager",
    pill: "CaaSy MVP",
    tagline: "Coaching Intelligence",
    accent: "navy",
    defaultView: "home",
    footerLabel: "MVP status",
    nav: mvpNav,
  },
  people_manager: {
    role: "people_manager",
    pill: "CaaSy MVP",
    tagline: "Coaching Intelligence",
    accent: "navy",
    defaultView: "home",
    footerLabel: "MVP status",
    nav: mvpNav,
  },
  executive: {
    role: "executive",
    pill: "CaaSy MVP",
    tagline: "Coaching Intelligence",
    accent: "navy",
    defaultView: "home",
    footerLabel: "MVP status",
    nav: mvpNav,
  },
  hr: {
    role: "hr",
    pill: "CaaSy MVP",
    tagline: "Coaching Intelligence",
    accent: "navy",
    defaultView: "home",
    footerLabel: "MVP status",
    nav: mvpNav,
  },
};
