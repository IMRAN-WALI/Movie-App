import { router } from "expo-router";

// router.back() crashes/warns if there's no screen to go back to
// (common after a router.replace() cleared the history). This checks
// first, and falls back to a safe known route instead.
export function safeBack(fallbackRoute = "/") {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute);
  }
}
