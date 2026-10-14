import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, MailPlus, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "./AppShell";
import { useSession } from "@/components/auth/SessionContext";
import { userManagement, type ManagedUser, type UserRole } from "@/infrastructure/user-management";

function formatDate(value: string | null) {
  if (!value) return "Nog niet";
  return new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function UserManagement() {
  const { session, profile } = useSession();
  const navigate = useNavigate();
  const isSuperAdmin = profile?.role === "super_admin";
  const [users, setUsers] = useState<ManagedUser[]>([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [email, setEmail] = useState(""), [displayName, setDisplayName] = useState(""), [password, setPassword] = useState(""), [role, setRole] = useState<UserRole>("user");
  const [passwords, setPasswords] = useState<Record<string, string>>({}), [roles, setRoles] = useState<Record<string, UserRole>>({});

  async function loadUsers() {
    setLoading(true); setError("");
    try { const result = await userManagement({ action: "list" }); setUsers(result.users ?? []); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Gebruikers konden niet worden geladen."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (profile?.role === "admin" || profile?.role === "super_admin") void loadUsers(); else setLoading(false); }, [profile?.role]);

  async function run(action: Parameters<typeof userManagement>[0], success: string) {
    setBusy(true); setError("");
    try { await userManagement(action); toast.success(success); await loadUsers(); return true; }
    catch (failure) { const message = failure instanceof Error ? failure.message : "Actie mislukt."; setError(message); toast.error(message); return false; }
    finally { setBusy(false); }
  }
  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    const created = await run({ action: "create", email, display_name: displayName, password, role }, "Gebruiker toegevoegd.");
    if (created) { setEmail(""); setDisplayName(""); setPassword(""); setRole("user"); }
  }
  async function changePassword(user: ManagedUser) {
    const next = passwords[user.id] ?? "";
    if (next.length < 8) { setError("Een wachtwoord moet minstens 8 tekens bevatten."); return; }
    const updated = await run({ action: "update_password", user_id: user.id, password: next }, "Wachtwoord gewijzigd.");
    if (updated) setPasswords(current => ({ ...current, [user.id]: "" }));
  }
  async function changeRole(user: ManagedUser) {
    const next = roles[user.id] ?? user.role;
    if (next === user.role) return;
    await run({ action: "update_role", user_id: user.id, role: next }, "Rol gewijzigd.");
  }
  async function removeUser(user: ManagedUser) {
    if (!window.confirm(`Gebruiker ${user.email} definitief verwijderen?`)) return;
    await run({ action: "delete", user_id: user.id }, "Gebruiker verwijderd.");
  }

  if (profile?.role !== "admin" && profile?.role !== "super_admin") return <AppShell><section className="rounded-2xl border border-destructive/30 bg-card p-6"><h1 className="text-xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-muted-foreground">Alleen beheerders kunnen gebruikers beheren.</p></section></AppShell>;
  return <AppShell><section className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-primary"><ShieldCheck className="size-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Beheer</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight">Gebruikersbeheer</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Beheer accounts, rollen en wachtwoorden. Elke wijziging wordt server-side gecontroleerd met de beheerderrol.</p></div><div className="flex flex-wrap items-center justify-end gap-2"><Button variant="outline" className="rounded-xl" onClick={() => navigate("/")}><ArrowLeft className="mr-2 size-4" />Terug naar werkruimte</Button><div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm"><Users className="size-4 text-primary" /><span className="font-semibold">{users.length} gebruikers</span></div></div></div>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
    <form onSubmit={createUser} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center gap-2"><MailPlus className="size-5 text-primary" /><div><h2 className="font-semibold">Nieuwe gebruiker</h2><p className="text-xs text-muted-foreground">Het account wordt onmiddellijk aangemaakt en bevestigd.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="space-y-1.5 text-xs font-semibold">E-mailadres<Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="naam@bedrijf.be" className="mt-1 rounded-xl" /></label><label className="space-y-1.5 text-xs font-semibold">Naam<Input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Voornaam familienaam" className="mt-1 rounded-xl" /></label><label className="space-y-1.5 text-xs font-semibold">Tijdelijk wachtwoord<Input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Minstens 8 tekens" className="mt-1 rounded-xl" /></label><label className="space-y-1.5 text-xs font-semibold">Rol<select value={role} onChange={event => setRole(event.target.value as UserRole)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="user">Gewone gebruiker</option><option value="admin">Beheerder</option>{isSuperAdmin && <option value="super_admin">Super admin</option>}</select></label></div><Button disabled={busy} className="mt-4 rounded-xl">{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MailPlus className="mr-2 size-4" />}Gebruiker toevoegen</Button></form>
    <section className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Bestaande gebruikers</h2><p className="text-xs text-muted-foreground">{isSuperAdmin ? "Je bent super admin en kunt alle gebruikers beheren." : "Je kunt je eigen wachtwoord beheren; andere beheerders worden beschermd."}</p></div><Button variant="outline" size="sm" className="rounded-xl" disabled={loading || busy} onClick={() => void loadUsers()}>Vernieuwen</Button></div>{loading ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Gebruikers laden…</div> : <div className="mt-4 space-y-3">{users.map(user => <article key={user.id} className="rounded-xl border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{user.display_name || "Zonder naam"}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p><p className="mt-1 text-xs text-muted-foreground">Aangemaakt {formatDate(user.created_at)} · Laatste login {formatDate(user.last_sign_in_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>{user.role === "super_admin" ? "Super admin" : user.role === "admin" ? "Beheerder" : "Gewone gebruiker"}</span></div><div className="mt-4 flex flex-wrap items-end gap-2"><label className="min-w-48 flex-1 space-y-1 text-xs font-semibold">Nieuwe rol<select value={roles[user.id] ?? user.role} onChange={event => setRoles(current => ({ ...current, [user.id]: event.target.value as UserRole }))} className="mt-1 h-10 w-full rounded-xl border bg-card px-3 text-sm"><option value="user">Gewone gebruiker</option><option value="admin">Beheerder</option>{isSuperAdmin && <option value="super_admin">Super admin</option>}</select></label><Button type="button" variant="outline" className="rounded-xl" disabled={busy || (roles[user.id] ?? user.role) === user.role} onClick={() => void changeRole(user)}><UserCog className="mr-2 size-4" />Rol opslaan</Button><label className="min-w-48 flex-1 space-y-1 text-xs font-semibold">Wachtwoord wijzigen<Input minLength={8} type="password" value={passwords[user.id] ?? ""} onChange={event => setPasswords(current => ({ ...current, [user.id]: event.target.value }))} placeholder="Nieuw wachtwoord · min. 8 tekens" className="mt-1 rounded-xl" /></label><Button type="button" variant="outline" className="rounded-xl" disabled={busy || !(passwords[user.id] ?? "") || (!isSuperAdmin && user.id !== session?.user.id)} onClick={() => void changePassword(user)}><KeyRound className="mr-2 size-4" />Wachtwoord wijzigen</Button><Button type="button" variant="outline" className="rounded-xl text-destructive hover:text-destructive" disabled={busy || user.id === session?.user.id || (!isSuperAdmin && user.role !== "user")} onClick={() => void removeUser(user)}><Trash2 className="mr-2 size-4" />Verwijderen</Button></div></article>)}{!users.length && <p className="py-8 text-sm text-muted-foreground">Geen gebruikers gevonden.</p>}</div>}</section>
  </section></AppShell>;
}
