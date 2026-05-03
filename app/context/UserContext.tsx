"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getAppOrigin, getE2EUser, getSupabaseBrowserClient, getSupabaseConfig, getUserDisplayName, isE2EAuthEnabled } from "@/lib/supabase";

export type CaaSyRole =
  | "individual"
  | "sales"
  | "sales_manager"
  | "people_manager"
  | "executive"
  | "hr";

export type LegacyRole = "SALES_REP" | "SALES_MANAGER";
export type UserRole = CaaSyRole | LegacyRole | null;

export const DEFAULT_ROLE: CaaSyRole = "individual";

export function normalizeRole(role: UserRole | string | undefined | null): CaaSyRole {
  if (role === "SALES_REP") return "sales";
  if (role === "SALES_MANAGER") return "sales_manager";
  if (
    role === "individual" ||
    role === "sales" ||
    role === "sales_manager" ||
    role === "people_manager" ||
    role === "executive" ||
    role === "hr"
  ) {
    return role;
  }
  return DEFAULT_ROLE;
}

interface UserContextType {
  user: User | null;
  displayName: string;
  email: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSupabaseConfigured: boolean;
  role: UserRole;
  caasyRole: CaaSyRole;
  setRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { isConfigured } = getSupabaseConfig();
  const e2eUser = isE2EAuthEnabled() ? getE2EUser() : null;
  const [user, setUser] = useState<User | null>(e2eUser);
  const [isAuthLoading, setIsAuthLoading] = useState(isConfigured && !e2eUser);
  const [roleState, setRoleState] = useState<UserRole>(DEFAULT_ROLE);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (e2eUser) {
      return;
    }
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [e2eUser]);

  const signInWithGoogle = useCallback(async () => {
    if (e2eUser) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const redirectTo = `${getAppOrigin()}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) throw error;
  }, [e2eUser]);

  const signOut = useCallback(async () => {
    if (e2eUser) {
      setUser(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [e2eUser]);

  const setRole = (role: UserRole) => {
    setRoleState(normalizeRole(role));
  };

  const value = useMemo<UserContextType>(() => {
    const caasyRole = normalizeRole(roleState);
    return {
      user,
      displayName: getUserDisplayName(user),
      email: user?.email ?? null,
      isAuthenticated: Boolean(user),
      isAuthLoading,
      isSupabaseConfigured: isConfigured,
      role: roleState,
      caasyRole,
      setRole,
      signInWithGoogle,
      signOut,
    };
  }, [isAuthLoading, isConfigured, roleState, signInWithGoogle, signOut, user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
