import { supabase } from "@/integrations/supabase/client";

export type UserRole = "user" | "admin";
export interface ManagedUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}
type UserManagementInput = Record<string, unknown> & { action: "list" | "create" | "delete" | "update_password" | "update_role" };

export async function userManagement(input: UserManagementInput) {
  const { data, error } = await supabase.functions.invoke("user-management", { body: input });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
  return data as { users?: ManagedUser[]; user?: ManagedUser; success?: boolean };
}
