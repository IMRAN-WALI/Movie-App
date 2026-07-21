// src/lib/auth.js
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

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
  return new Promise(async (resolve) => {
    let settled = false;

    // Deep link ko independently sunte hain (dismiss bug ka workaround)
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      const tokens = extractTokensFromUrl(url);
      if (tokens && !settled) {
        settled = true;
        subscription.remove();
        WebBrowser.dismissBrowser();
        const { data, error } = await supabase.auth.setSession(tokens);
        resolve(
          error
            ? { session: null, error: error.message }
            : { session: data.session, error: null },
        );
      }
    });

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });

      if (error) throw error;
      const authUrl = data?.url;
      if (!authUrl) throw new Error("Supabase se auth URL nahi mila");

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
      );

      if (!settled) {
        if (result.type === "success" && result.url) {
          const tokens = extractTokensFromUrl(result.url);
          if (tokens) {
            settled = true;
            subscription.remove();
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession(tokens);
            resolve(
              sessionError
                ? { session: null, error: sessionError.message }
                : { session: sessionData.session, error: null },
            );
            return;
          }
        }

        // Thoda wait karo — shayad Linking listener already deep link pakad chuka ho
        setTimeout(() => {
          if (!settled) {
            settled = true;
            subscription.remove();
            resolve({ session: null, error: "Login cancel ya fail ho gaya" });
          }
        }, 1500);
      }
    } catch (err) {
      if (!settled) {
        settled = true;
        subscription.remove();
        resolve({ session: null, error: err.message });
      }
    }
  });
}

export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );
  return listener;
}
