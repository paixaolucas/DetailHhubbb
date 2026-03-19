// =============================================================================
// AUTH SERVICE
// Handles registration, login, token refresh, and session management
// =============================================================================

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendWelcomeEmail, sendEmailVerificationEmail } from "@/lib/email/send";
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

/** Returns true if userId has an active PlatformMembership */
async function hasActivePlatform(userId: string): Promise<boolean> {
  const m = await db.platformMembership.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });
  if (m?.status !== "ACTIVE") return false;
  if (m.currentPeriodEnd != null && m.currentPeriodEnd <= new Date()) return false;
  return true;
}

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
  const newReferralCode = crypto.randomBytes(6).toString("hex").toUpperCase();
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");

  // Resolve who referred this new user (influencer's referralCode on their User)
  let referredById: string | undefined;
  if (input.referralCode) {
    const referrer = await db.user.findUnique({
      where: { referralCode: input.referralCode },
      select: { id: true },
    });
    if (referrer) referredById = referrer.id;
  }

  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: UserRole.COMMUNITY_MEMBER,
      referralCode: newReferralCode,
      emailVerifyToken,
      ...(referredById ? { referredById } : {}),
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
    createAccessToken({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }),
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

  // Send email verification (non-blocking) — welcome email sent after verification
  sendEmailVerificationEmail({ email: user.email, firstName: user.firstName }, emailVerifyToken).catch(
    (err) => console.error("[Auth] verification email failed:", err)
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
// GOOGLE OAUTH LOGIN / REGISTER
// =============================================================================

interface GoogleAuthInput {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

export async function loginOrRegisterWithGoogle(
  input: GoogleAuthInput,
  ipAddress?: string,
  referralCode?: string
): Promise<{ user: AuthSession; tokens: AuthTokens }> {
  // Check if user already exists by googleId or email
  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ googleId: input.googleId }, { email: input.email }],
    },
    select: {
      id: true,
      email: true,
      googleId: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isActive: true,
      isBanned: true,
      bannedReason: true,
    },
  });

  if (existingUser) {
    // Existing user — check account status
    if (existingUser.isBanned) {
      throw new AppError(
        "Conta suspensa. Entre em contato com o suporte.",
        403,
        "ACCOUNT_BANNED"
      );
    }

    if (!existingUser.isActive) {
      throw new AppError("Account deactivated", 403, "ACCOUNT_INACTIVE");
    }

    // Link Google ID if not yet linked (user registered with email/password before)
    if (!existingUser.googleId) {
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: input.googleId,
          emailVerified: new Date(),
          ...(input.avatarUrl && !existingUser.avatarUrl
            ? { avatarUrl: input.avatarUrl }
            : {}),
        },
      });
    }

    // Generate tokens
    const [hasPlatform, refreshToken] = await Promise.all([
      hasActivePlatform(existingUser.id),
      createRefreshToken(existingUser.id),
    ]);
    const accessToken = await createAccessToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      hasPlatform,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.$transaction([
      db.refreshToken.create({
        data: {
          token: refreshToken,
          userId: existingUser.id,
          expiresAt,
          ipAddress,
        },
      }),
      db.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
      }),
    ]);

    return {
      user: {
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        avatarUrl: existingUser.avatarUrl,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: getAccessTokenExpiry(),
      },
    };
  }

  // New user — register
  const newReferralCode = crypto.randomBytes(6).toString("hex").toUpperCase();

  let referredById: string | undefined;
  if (referralCode) {
    const referrer = await db.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (referrer) referredById = referrer.id;
  }

  const user = await db.user.create({
    data: {
      email: input.email,
      googleId: input.googleId,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
      emailVerified: input.emailVerified ? new Date() : null,
      role: UserRole.COMMUNITY_MEMBER,
      referralCode: newReferralCode,
      ...(referredById ? { referredById } : {}),
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
    createAccessToken({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }),
    createRefreshToken(user.id),
  ]);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress,
    },
  });

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ email: user.email, firstName: user.firstName }).catch(
    (err) => console.error("[Auth] welcome email failed:", err)
  );

  return {
    user: {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    },
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
      googleId: true,
      emailVerified: true,
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
      "Conta suspensa. Entre em contato com o suporte.",
      403,
      "ACCOUNT_BANNED"
    );
  }

  if (!user.isActive) {
    throw new AppError("Account deactivated", 403, "ACCOUNT_INACTIVE");
  }

  // Block login if email not verified (Google accounts are auto-verified)
  if (!user.emailVerified && !user.googleId) {
    throw new AppError(
      "Confirme seu email antes de fazer login. Verifique sua caixa de entrada.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  // User registered via Google only (no password set)
  if (!user.passwordHash) {
    throw new AppError(
      "Esta conta usa login com Google. Clique em \"Entrar com Google\".",
      400,
      "GOOGLE_ONLY_ACCOUNT"
    );
  }

  const passwordValid = await verifyPassword(
    input.password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const [hasPlatform, refreshToken] = await Promise.all([
    hasActivePlatform(user.id),
    createRefreshToken(user.id),
  ]);
  const accessToken = await createAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    hasPlatform,
  });

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
        select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true },
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

  // Rotate refresh token (embed hasPlatform claim for fast-path membership checks)
  const [hasPlatform, newRefreshToken] = await Promise.all([
    hasActivePlatform(storedToken.user.id),
    createRefreshToken(storedToken.user.id),
  ]);
  const newAccessToken = await createAccessToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
    firstName: storedToken.user.firstName,
    lastName: storedToken.user.lastName,
    hasPlatform,
  });

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
