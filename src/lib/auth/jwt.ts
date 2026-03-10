// =============================================================================
// JWT UTILITIES
// Handles token creation, verification, and refresh logic
// =============================================================================

import { SignJWT, jwtVerify } from "jose";
import { JWTPayload, AppError } from "@/types";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET env var is required");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN ?? "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

// =============================================================================
// TOKEN CREATION
// =============================================================================

export async function createAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  return await new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(userId: string): Promise<string> {
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET);
}

// =============================================================================
// TOKEN VERIFICATION
// =============================================================================

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        throw new AppError("Token expired", 401, "TOKEN_EXPIRED");
      }
    }
    throw new AppError("Invalid token", 401, "INVALID_TOKEN");
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
    });

    return { userId: payload.sub as string };
  } catch {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }
}

// =============================================================================
// TOKEN EXTRACTION
// =============================================================================

export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export function getAccessTokenExpiry(): number {
  const match = ACCESS_TOKEN_EXPIRY.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * (multipliers[unit] ?? 60);
}
