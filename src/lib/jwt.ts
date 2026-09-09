import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";

function requireAccessSecret(): string {
  if (!ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }
  return ACCESS_SECRET;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, requireAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, requireAccessSecret()) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings, never JWTs. Only a SHA-256 hash
 * of the token is ever persisted, so a database leak does not hand out
 * usable refresh tokens.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("hex");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
