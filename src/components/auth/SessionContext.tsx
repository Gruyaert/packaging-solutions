import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";

export type UserRole = "user" | "admin" | "super_admin";
export interface UserProfile { id: string; email: string; display_name: string; role: UserRole; }
type SessionContextValue = { session: Session | null; profile: UserProfile | null; loading: boolean; profileLoading: boolean; error: string; recovery: boolean; finishRecovery(): void };
const SessionContext = createContext<SessionContextValue>({ session: null, profile: null, loading: true, profileLoading: true, error: "", recovery: false, finishRecovery() {} });
export const useSession = () => useContext(SessionContext);

export function SessionContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null), [profile, setProfile] = useState<UserProfile | null>(null), [loading, setLoading] = useState(true), [profileLoading, setProfileLoading] = useState(true), [error, setError] = useState("");
  const [recovery, setRecovery] = useState(window.location.pathname === "/reset-password" || new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
  const navigate = useNavigate(), query = useQueryClient();
  useEffect(() => {
    let mounted = true;
    async function loadProfile(next: Session | null) {
      if (!next) { if (mounted) { setProfile(null); setProfileLoading(false); } return; }
      setProfileLoading(true);
      const { data, error: failure } = await supabase.from("profiles").select("id, email, display_name, role").eq("id", next.user.id).maybeSingle();
      if (!mounted) return;
      if (failure) setError(failure.message);
      setProfile(data as UserProfile | null);
      setProfileLoading(false);
    }
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!mounted) return;
      if (failure) setError(authErrorMessage(failure));
      setSession(data.session); setLoading(false); void loadProfile(data.session);
    }).catch(failure => { if (mounted) { setError(authErrorMessage(failure)); setLoading(false); setProfileLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      setSession(next); setLoading(false); void loadProfile(next);
      if (next) setError("");
      if (event === "SIGNED_OUT") { query.clear(); setRecovery(false); setError(""); }
      if (event === "PASSWORD_RECOVERY") { setRecovery(true); navigate("/reset-password", { replace: true }); }
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, [navigate, query]);
  return <SessionContext.Provider value={{ session, profile, loading, profileLoading, error, recovery, finishRecovery: () => setRecovery(false) }}>{children}</SessionContext.Provider>;
}
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading, recovery, error } = useSession();
  if (loading) return <p className="p-8 text-sm text-muted-foreground">Sessie controleren…</p>;
  if (error) return <p role="alert" className="p-8 text-destructive">{error}</p>;
  if (recovery) return <Navigate to="/reset-password" replace />;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading, profileLoading, profile } = useSession();
  if (loading || profileLoading) return <p className="p-8 text-sm text-muted-foreground">Bevoegdheden controleren…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return profile?.role === "admin" || profile?.role === "super_admin" ? <>{children}</> : <Navigate to="/" replace />;
}
