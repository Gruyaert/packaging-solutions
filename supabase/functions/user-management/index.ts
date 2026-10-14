import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const FUNCTION_NAME = "user-management";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

type Role = "user" | "admin" | "super_admin";
type Action = "list" | "create" | "delete" | "update_password" | "update_role";
type AuthorizedActor = { id: string; role: Role };

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function badRequest(message: string) {
  return response({ error: message }, 400);
}

function forbidden(message: string) {
  return response({ error: message }, 403);
}

function isRole(value: unknown): value is Role {
  return value === "user" || value === "admin" || value === "super_admin";
}

function isManager(role: unknown): role is "admin" | "super_admin" {
  return role === "admin" || role === "super_admin";
}

async function requireAdmin(req: Request) {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return { error: response({ error: "Unauthorized" }, 401) };
  const token = header.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: response({ error: "Unauthorized" }, 401) };
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError || !isManager(profile?.role)) return { error: response({ error: "Forbidden" }, 403) };
  return { actor: { id: data.user.id, role: profile.role as Role } satisfies AuthorizedActor };
}

async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin.from("profiles").select("id, role").eq("id", userId).single();
  if (error || !data) throw error ?? new Error("Gebruiker niet gevonden.");
  return data as { id: string; role: Role };
}

async function listUsers() {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) throw authError;
  const { data: profiles, error: profilesError } = await supabaseAdmin.from("profiles").select("id, email, display_name, role, created_at, updated_at");
  if (profilesError) throw profilesError;
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  return (authData.users ?? []).map(user => {
    const profile = profileById.get(user.id);
    const role: Role = profile?.role === "super_admin" ? "super_admin" : profile?.role === "admin" ? "admin" : "user";
    return {
      id: user.id,
      email: user.email ?? profile?.email ?? "",
      display_name: profile?.display_name ?? "",
      role,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
    };
  });
}

async function ensureNotLastManager(targetId: string, nextRole: Role) {
  if (nextRole !== "user") return;
  const { count, error } = await supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]);
  if (error) throw error;
  const target = await getProfile(targetId);
  if (isManager(target.role) && (count ?? 0) <= 1) throw new Error("De laatste beheerder kan niet worden verwijderd of gedegradeerd.");
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authorization = await requireAdmin(req);
  if (authorization.error) return authorization.error;
  const actor = authorization.actor;

  try {
    const input = await req.json() as Record<string, unknown>;
    const action = input.action as Action;
    console.info(`[${FUNCTION_NAME}] request`, { action, actor: actor.id, actorRole: actor.role });
    if (!["list", "create", "delete", "update_password", "update_role"].includes(action)) return badRequest("Ongeldige beheeractie.");

    if (action === "list") return response({ users: await listUsers() });

    if (action === "create") {
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      const password = typeof input.password === "string" ? input.password : "";
      const role = isRole(input.role) ? input.role : "user";
      const displayName = typeof input.display_name === "string" ? input.display_name.trim() : "";
      if (!email || !email.includes("@")) return badRequest("Geef een geldig e-mailadres op.");
      if (password.length < 8) return badRequest("Een wachtwoord moet minstens 8 tekens bevatten.");
      if (role === "super_admin" && actor.role !== "super_admin") return forbidden("Alleen een super admin kan een super admin aanmaken.");
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: displayName } });
      if (error || !data.user) throw error ?? new Error("Gebruiker kon niet worden aangemaakt.");
      const { error: profileError } = await supabaseAdmin.from("profiles").update({ email, display_name: displayName, role, updated_at: new Date().toISOString() }).eq("id", data.user.id);
      if (profileError) { await supabaseAdmin.auth.admin.deleteUser(data.user.id); throw profileError; }
      return response({ user: { id: data.user.id, email, display_name: displayName, role } }, 201);
    }

    const targetId = typeof input.user_id === "string" ? input.user_id : "";
    if (!targetId) return badRequest("Gebruiker ontbreekt.");
    const target = await getProfile(targetId);
    if (action === "delete") {
      if (targetId === actor.id) return badRequest("Je kunt je eigen beheerderaccount niet verwijderen.");
      if (isManager(target.role) && actor.role !== "super_admin") return forbidden("Alleen een super admin kan andere beheerders verwijderen.");
      await ensureNotLastManager(targetId, "user");
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);
      if (error) throw error;
      return response({ success: true });
    }
    if (action === "update_password") {
      const password = typeof input.password === "string" ? input.password : "";
      if (password.length < 8) return badRequest("Een wachtwoord moet minstens 8 tekens bevatten.");
      if (targetId !== actor.id && actor.role !== "super_admin") return forbidden("Een beheerder kan alleen het eigen wachtwoord wijzigen.");
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetId, { password });
      if (error) throw error;
      return response({ success: true });
    }
    const role = input.role;
    if (!isRole(role)) return badRequest("Ongeldige rol.");
    if (targetId === actor.id && role !== target.role) return badRequest("Je kunt je eigen rol niet wijzigen.");
    if ((role === "super_admin" || target.role === "super_admin") && actor.role !== "super_admin") return forbidden("Alleen een super admin kan super-adminrollen beheren.");
    await ensureNotLastManager(targetId, role);
    const { error } = await supabaseAdmin.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", targetId);
    if (error) throw error;
    return response({ success: true });
  } catch (error) {
    console.error(`[${FUNCTION_NAME}] request failed`, { error: error instanceof Error ? error.message : String(error) });
    return response({ error: error instanceof Error ? error.message : "Gebruikersbeheer mislukt." }, 400);
  }
});
