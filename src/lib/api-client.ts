import type { ApiResponseBody } from "@/types/api";
import type { AuthResultDTO } from "@/types/auth";
import { useAuthStore } from "@/features/auth/store/auth-store";

const API_BASE = "/api/v1";
const AUTH_PATHS_NO_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Only needed for calls made before a session exists (login/register). */
  accessToken?: string;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const json = (await res.json()) as ApiResponseBody<AuthResultDTO>;
        if (!json.success) {
          useAuthStore.getState().clearSession();
          return null;
        }
        useAuthStore.getState().setAccessToken(json.data.tokens.accessToken, json.data.tokens.refreshToken);
        return json.data.tokens.accessToken;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function doFetch<T>(path: string, options: RequestOptions, accessToken: string | null) {
  const { currentWorkspaceId } = useAuthStore.getState();
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(currentWorkspaceId ? { "X-Workspace-Id": currentWorkspaceId } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const json = (await res.json()) as ApiResponseBody<T>;
  return { res, json };
}

/** Thin, typed wrapper around fetch for the /api/v1 contract, with automatic token refresh on 401. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const canRefresh = !AUTH_PATHS_NO_REFRESH.includes(path);
  const accessToken = options.accessToken ?? useAuthStore.getState().accessToken;

  let { res, json } = await doFetch<T>(path, options, accessToken);

  if (!json.success && json.error.code === "UNAUTHORIZED" && canRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      ({ res, json } = await doFetch<T>(path, options, newToken));
    }
  }

  if (!json.success) {
    throw new ApiClientError(json.error.code, json.error.message, res.status);
  }
  return json.data;
}
