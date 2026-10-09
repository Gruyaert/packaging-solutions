import { AuthApiError } from "@supabase/supabase-js";

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.status === 429) return "Te veel pogingen. Wacht even en probeer opnieuw.";
    if (error.code === "invalid_credentials") return "E-mailadres of wachtwoord is onjuist.";
    return error.message;
  }
  return error instanceof Error ? error.message : "De aanmelding kon niet worden verwerkt.";
}
