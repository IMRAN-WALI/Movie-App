import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export async function signUpWithEmail(email, password, username) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split("@")[0],
        },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("rate limit")) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      if (error.message?.toLowerCase().includes("already registered")) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }
      throw error;
    }

    if (data.user) {
      try {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          username: username || email.split("@")[0],
          display_name: username || null,
        });
      } catch (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    // Confirm email OFF hai, isliye signUp() khud auto-login kar deta hai.
    // Yahan turant sign out karte hain taaki landing page ka guard
    // "/(tabs)" pe auto-jump na kare — user seedha login page pe jaye.
    if (data.session) {
      await supabase.auth.signOut();
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        throw new Error("EMAIL_NOT_CONFIRMED");
      }
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("INVALID_CREDENTIALS");
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    const redirectTo = makeRedirectUri({
      scheme: "movieapp",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success") {
        const url = result.url;

        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(url);

        if (sessionError) throw sessionError;

        return sessionData;
      }
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session);
    },
  );
  return () => listener.subscription.unsubscribe();
}

export async function resendConfirmationEmail(email) {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });
    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
}
