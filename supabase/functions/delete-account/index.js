import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // Only POST is allowed
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // ============================================
    // GET USER AUTHORIZATION TOKEN
    // ============================================

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ============================================
    // SUPABASE ENVIRONMENT VARIABLES
    // ============================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    // ============================================
    // USER CLIENT
    // Used only to verify logged-in user
    // ============================================

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // ============================================
    // GET CURRENT USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("🗑️ Delete account requested for:", user.id);

    // ============================================
    // ADMIN CLIENT
    //
    // SERVICE ROLE KEY ONLY EXISTS ON SERVER
    // NEVER PUT THIS KEY IN EXPO APP
    // ============================================

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ============================================
    // DELETE USER
    // ============================================

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteError) {
      console.error("❌ Delete user error:", deleteError);

      return new Response(
        JSON.stringify({
          success: false,
          error: deleteError.message || "Failed to delete account.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("✅ Account deleted successfully:", user.id);

    // ============================================
    // SUCCESS RESPONSE
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("❌ Delete account function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
