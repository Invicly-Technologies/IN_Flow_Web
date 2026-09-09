import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-response";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/jwt";

/**
 * Extracts and verifies the caller's identity from the Authorization header.
 * Every authenticated route handler (web and, indirectly, mobile via the
 * same /api/v1 contract) should call this before touching any resource.
 */
export function requireAuth(request: NextRequest): AccessTokenPayload {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError("UNAUTHORIZED", "Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    return verifyAccessToken(token);
  } catch {
    throw new ApiError("UNAUTHORIZED", "Access token is invalid or expired");
  }
}

export function requestContext(request: NextRequest) {
  return {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  };
}
