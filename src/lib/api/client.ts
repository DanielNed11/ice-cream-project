import type { ApiErrorBody, AuthTokens } from "@/lib/api/types";
import { clearTokens, getAccessToken, getRefreshToken, storeTokens } from "@/lib/auth/tokens";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skips the Authorization header, for login/register/refresh. */
  anonymous?: boolean;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(response.status, body.message ?? response.statusText);
  } catch {
    return new ApiError(response.status, response.statusText || "Request failed");
  }
}

async function send(path: string, options: RequestOptions, accessToken: string | null) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

// A single refresh in flight at a time: several components can hit a 401 at
// once on first paint, and rotating the refresh token twice would invalidate
// the second attempt.
let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "X-Refresh-Token": refreshToken },
      });
      if (!response.ok) return null;

      const tokens = (await response.json()) as AuthTokens;
      storeTokens(tokens);
      return tokens;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.anonymous ? null : getAccessToken();
  let response = await send(path, options, token);

  // Access tokens last 15 minutes, so a 401 on a request we did send a token
  // for usually just means it expired. Rotate once and replay.
  if (response.status === 401 && !options.anonymous && token) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      clearTokens();
      throw await toApiError(response);
    }
    response = await send(path, options, refreshed.accessToken);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
