import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";

const SessionContext = createContext<{ session: Session | null; loading: boolean; error: string; recovery: boolean; finishRecovery(): void }>({ session: null, loading: true, error: "", recovery: false, finishRecovery() {} });
export const useSession = () => useContext(SessionContext);

export function SessionContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [recovery, setRecovery] = useState(window.location.pathname === "/reset-password" || new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
  const navigate = useNavigate(), query = useQueryClient();
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!mounted) return;
      if (failure) setError(authErrorMessage(failure));
      setSession(data.session); setLoading(false);
    }).catch(failure => { if (mounted) { setError(authErrorMessage(failure)); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      setSession(next); setLoading(false);
      if (next) setError("");
      if (event === "SIGNED_OUT") { query.clear(); setRecovery(false); setError(""); }
      if (event === "PASSWORD_RECOVERY") { setRecovery(true); navigate("/reset-password", { replace: true }); }
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, [navigate, query]);
  return <SessionContext.Provider value={{ session, loading, error, recovery, finishRecovery: () => setRecovery(false) }}>{children}</SessionContext.Provider>;
}
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading, recovery, error } = useSession();
  if (loading) return <p className="p-8 text-sm text-muted-foreground">Sessie controleren…</p>;
  if (error) return <p role="alert" className="p-8 text-destructive">{error}</p>;
  if (recovery) return <Navigate to="/reset-password" replace />;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}
