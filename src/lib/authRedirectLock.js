// Simple module-level flag. Screens that auto-redirect based on session
// changes (like app/index.jsx) check this before navigating, so we can
// suppress the redirect during flows — like signup — that briefly create
// a transient session before we intentionally sign back out.

let suppressed = false;

export function suppressAuthRedirect(value) {
  suppressed = value;
}

export function isAuthRedirectSuppressed() {
  return suppressed;
}
