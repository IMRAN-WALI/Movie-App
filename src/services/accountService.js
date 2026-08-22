import { supabase } from "../lib/supabase";
import { invokeEdgeFunction } from "../lib/supabase";

export async function deleteCurrentAccount() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No authenticated user found.");
  }

  const result = await invokeEdgeFunction("delete-account", {});

  if (!result?.success) {
    throw new Error(result?.error || "Unable to delete your account.");
  }

  return true;
}
