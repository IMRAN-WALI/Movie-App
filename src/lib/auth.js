// src/lib/auth.js
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

function extractTokensFromUrl(url) {
  const raw = url.split("#")[1] || url.split("?")[1];
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

export async function signInWithGoogle() {
  try {
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: "movieapp",
      path: "auth/callback",
    });

    console.log("====================================");
    console.log("Redirect URL:", redirectUrl);
    console.log("====================================");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error("Supabase OAuth Error:", error);
      throw error;
    }

    if (!data?.url) {
      throw new Error("No OAuth URL returned from Supabase.");
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    console.log("OAuth Result:", result);

    if (result.type === "success" && result.url) {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(result.url);

      if (sessionError) {
        console.error("Exchange Session Error:", sessionError);
        throw sessionError;
      }

      console.log("Google Login Success");
      return sessionData;
    }

    if (result.type === "cancel") {
      throw new Error("Google Sign-In cancelled.");
    }

    throw new Error(`Unexpected auth result: ${result.type}`);
  } catch (err) {
    console.error("Google Sign-In Failed:");
    console.error(err);

    Alert.alert(
      "Google Login Error",
      err?.message || JSON.stringify(err, null, 2),
    );

    throw err;
  }
}

export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );
  return listener;
}
