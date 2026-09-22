import type { AuthTokens } from "@/lib/api/types";

const ACCESS_TOKEN_KEY = "nano.accessToken";
const REFRESH_TOKEN_KEY = "nano.refreshToken";

// Every read is guarded: these run during render on the client, but the module
// is also imported into components Next renders on the server first.
function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_TOKEN_KEY);
}

export function storeTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // A browser with site data blocked: the session simply will not persist.
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
