import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupPage } from "../components/caasy/SignupPage";
import { CaasyDashboard } from "../components/caasy/CaasyDashboard";

const push = vi.fn();
const replace = vi.fn();
const signInWithGoogle = vi.fn();
const signOut = vi.fn();

let authState = {
  user: { id: "user_test", email: "user@example.com" },
  displayName: "Test User",
  email: "user@example.com",
  isAuthenticated: true,
  isAuthLoading: false,
  isSupabaseConfigured: true,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../app/context/UserContext", () => ({
  DEFAULT_ROLE: "individual",
  normalizeRole: (role?: string | null) => {
    if (
      role === "sales" ||
      role === "sales_manager" ||
      role === "people_manager" ||
      role === "executive" ||
      role === "hr"
    ) return role;
    return "individual";
  },
  useUser: () => ({
    ...authState,
    role: "individual",
    caasyRole: "individual",
    setRole: vi.fn(),
    signInWithGoogle,
    signOut,
  }),
}));

vi.mock("../lib/report-service", () => ({
  getRecentReports: vi.fn().mockResolvedValue([]),
}));

describe("CaaSy UI", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    signInWithGoogle.mockClear();
    signOut.mockClear();
    authState = {
      user: { id: "user_test", email: "user@example.com" },
      displayName: "Test User",
      email: "user@example.com",
      isAuthenticated: true,
      isAuthLoading: false,
      isSupabaseConfigured: true,
    };
  });

  it("starts Google sign in from the access page", async () => {
    authState = {
      user: null,
      displayName: "CaaSy user",
      email: null,
      isAuthenticated: false,
      isAuthLoading: false,
      isSupabaseConfigured: true,
    };

    render(<SignupPage />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(signInWithGoogle).toHaveBeenCalled();
  });

  it("routes authenticated users to the dashboard on click", () => {
    render(<SignupPage />);

    fireEvent.click(screen.getByRole("button", { name: /open dashboard/i }));

    expect(push).toHaveBeenCalledWith("/dashboard?role=individual&view=home");
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders the same coaching navigation for every role", async () => {
    render(<CaasyDashboard initialRole="sales_manager" initialView="home" />);

    expect(await screen.findAllByText("Dashboard")).not.toHaveLength(0);
    expect(screen.getAllByText("Coach my Call").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coach Me").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pipeline Intelligence")).not.toBeInTheDocument();
    expect(screen.queryByText("Team Overview")).not.toBeInTheDocument();
  });

  it("renders coming soon for unknown views", async () => {
    render(<CaasyDashboard initialRole="sales" initialView="not-real" />);

    expect(await screen.findByText(/coming soon/i)).toBeInTheDocument();
  });
});
