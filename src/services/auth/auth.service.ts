// =============================================================================
// AUTH SERVICE
// Handles registration, login, token refresh, and session management
// =============================================================================

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendWelcomeEmail } from "@/lib/email/send";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpiry,
} from "@/lib/auth/jwt";
import { AppError, ConflictError, UnauthorizedError } from "@/types";
import type { RegisterInput, LoginInput } from "@/lib/validations/auth";
import type { AuthTokens, AuthSession } from "@/types";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

// =============================================================================
// REGISTRATION
// =============================================================================

export async function registerUser(
  input: RegisterInput,
  ipAddress?: string
): Promise<{ user: AuthSession; tokens: AuthTokens }> {
  const existing = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const referralCode = crypto.randomBytes(6).toString("hex").toUpperCase();

  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: UserRole.COMMUNITY_MEMBER,
      referralCode,
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  });

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken({ userId: user.id, email: user.email, role: user.role }),
    createRefreshToken(user.id),
  ]);

  // Store refresh token
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  );

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress,
    },
  });

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  };

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ email: user.email, firstName: user.firstName }).catch(
    (err) => console.error("[Auth] welcome email failed:", err)
  );

  return {
    user: session,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpiry(),
    },
  };
}

// =============================================================================
// LOGIN
// =============================================================================

export async function loginUser(
  input: LoginInput,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: AuthSession; tokens: AuthTokens }> {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isActive: true,
      isBanned: true,
      bannedReason: true,
    },
  });

  if (!user) {
    // Timing-safe: still hash to prevent user enumeration
    await hashPassword("dummy-prevent-timing-attack");
    throw new UnauthorizedError("Invalid credentials");
  }

  if (user.isBanned) {
    throw new AppError(
      `Account suspended: ${user.bannedReason ?? "Contact support"}`,
      403,
      "ACCOUNT_BANNED"
    );
  }

  if (!user.isActive) {
    throw new AppError("Account deactivated", 403, "ACCOUNT_INACTIVE");
  }

  const passwordValid = await verifyPassword(
    input.password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken({ userId: user.id, email: user.email, role: user.role }),
    createRefreshToken(user.id),
  ]);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store new refresh token and update last login
  await db.$transaction([
    db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    }),
  ]);

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  };

  return {
    user: session,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpiry(),
    },
  };
}

// =============================================================================
// TOKEN REFRESH
// =============================================================================

export async function refreshAccessToken(
  refreshTokenString: string
): Promise<AuthTokens> {
  const { userId } = await verifyRefreshToken(refreshTokenString);

  const storedToken = await db.refreshToken.findUnique({
    where: { token: refreshTokenString },
    include: {
      user: {
        select: { id: true, email: true, role: true, isActive: true },
      },
    },
  });

  if (!storedToken || storedToken.isRevoked) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (storedToken.expiresAt < new Date()) {
    await db.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });
    throw new UnauthorizedError("Refresh token expired");
  }

  if (storedToken.userId !== userId) {
    throw new UnauthorizedError("Token mismatch");
  }

  if (!storedToken.user.isActive) {
    throw new AppError("Account deactivated", 403, "ACCOUNT_INACTIVE");
  }

  // Rotate refresh token
  const [newAccessToken, newRefreshToken] = await Promise.all([
    createAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    }),
    createRefreshToken(storedToken.user.id),
  ]);

  await db.$transaction([
    db.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    }),
    db.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: storedToken.ipAddress,
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: getAccessTokenExpiry(),
  };
}

// =============================================================================
// LOGOUT
// =============================================================================

export async function logoutUser(refreshToken: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

// =============================================================================
// SESSION VALIDATION
// =============================================================================

export async function getSessionUser(userId: string): Promise<AuthSession> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isActive: true,
      isBanned: true,
    },
  });

  if (!user) throw new UnauthorizedError("User not found");
  if (!user.isActive || user.isBanned) {
    throw new AppError("Account suspended", 403, "ACCOUNT_SUSPENDED");
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  };
}
