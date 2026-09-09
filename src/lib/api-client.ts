import type { ApiResponseBody } from "@/types/api";

const API_BASE = "/api/v1";

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
  accessToken?: string;
}

/** Thin, typed wrapper around fetch for the /api/v1 contract. */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, accessToken }: RequestOptions = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as ApiResponseBody<T>;

  if (!json.success) {
    throw new ApiClientError(json.error.code, json.error.message, res.status);
  }

  return json.data;
}
