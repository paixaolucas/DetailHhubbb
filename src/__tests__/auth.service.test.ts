// =============================================================================
// AUTH SERVICE — Unit Tests
// Covers: registerUser, loginUser, refreshAccessToken, logoutUser
// All external deps (Prisma, bcrypt, JWT, email) are mocked.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (must be declared before imports) ───────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    platformMembership: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((ops: any) => Promise.all(ops)),
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2b$10$hashed_password"),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmailVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/jwt", () => ({
  createAccessToken: vi.fn().mockResolvedValue("mock_access_token"),
  createRefreshToken: vi.fn().mockResolvedValue("mock_refresh_token"),
  verifyRefreshToken: vi.fn().mockResolvedValue({ userId: "user_123" }),
  getAccessTokenExpiry: vi.fn().mockReturnValue(7200),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "@/services/auth/auth.service";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { ConflictError, UnauthorizedError } from "@/types";

// ── Test fixtures ─────────────────────────────────────────────────────────────

const mockUser = {
  id: "user_123",
  email: "joao@example.com",
  passwordHash: "$2b$10$hashed_password",
  googleId: null,
  emailVerified: new Date("2026-01-01"),
  role: "COMMUNITY_MEMBER",
  firstName: "João",
  lastName: "Silva",
  avatarUrl: null,
  isActive: true,
  isBanned: false,
  bannedReason: null,
};

const mockRefreshTokenRecord = {
  id: "rt_123",
  token: "mock_refresh_token",
  userId: "user_123",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  isRevoked: false,
  ipAddress: null,
  user: {
    id: "user_123",
    email: "joao@example.com",
    role: "COMMUNITY_MEMBER",
    firstName: "João",
    lastName: "Silva",
    isActive: true,
  },
};

// ── Test suites ───────────────────────────────────────────────────────────────

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.platformMembership.findUnique).mockResolvedValue(null);
    vi.mocked(db.refreshToken.create).mockResolvedValue(mockRefreshTokenRecord as never);
    vi.mocked(db.user.update).mockResolvedValue(mockUser as never);
    vi.mocked(db.$transaction).mockImplementation((ops: any) => Promise.all(ops));
  });

  it("throws ConflictError when email is already registered", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "existing_user" } as never);

    await expect(
      registerUser({ email: "joao@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" })
    ).rejects.toThrow(ConflictError);
  });

  it("creates user and returns access + refresh tokens on success", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce(mockUser as never);

    const result = await registerUser({
      email: "novo@example.com",
      password: "Pass@123",
      confirmPassword: "Pass@123",
      firstName: "João",
      lastName: "Silva",
    });

    expect(result.user.email).toBe("joao@example.com");
  });

  it("hashes the password before storing", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce(mockUser as never);

    await registerUser({ email: "novo@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" });

    expect(hashPassword).toHaveBeenCalledWith("Pass@123");
    const createArgs = vi.mocked(db.user.create).mock.calls[0][0];
    expect(createArgs.data.passwordHash).toBe("$2b$10$hashed_password");
  });

  it("stores emailVerifyToken as a non-empty string", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce(mockUser as never);

    await registerUser({ email: "novo@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" });

    const createArgs = vi.mocked(db.user.create).mock.calls[0][0];
    expect(typeof createArgs.data.emailVerifyToken).toBe("string");
    expect(createArgs.data.emailVerifyToken).toHaveLength(64); // 32 bytes hex
  });

  it("saves the refresh token in the database", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce(mockUser as never);

    await registerUser({ email: "novo@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" });

    expect(db.refreshToken.create).toHaveBeenCalledOnce();
    const createArgs = vi.mocked(db.refreshToken.create).mock.calls[0][0];
    expect(createArgs.data.token).toBe("mock_refresh_token");
    expect(createArgs.data.userId).toBe("user_123");
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.platformMembership.findUnique).mockResolvedValue(null);
    vi.mocked(db.refreshToken.create).mockResolvedValue(mockRefreshTokenRecord as never);
    vi.mocked(db.user.update).mockResolvedValue(mockUser as never);
    vi.mocked(db.$transaction).mockImplementation((ops: any) => Promise.all(ops));
    vi.mocked(verifyPassword).mockResolvedValue(true);
  });

  it("throws UnauthorizedError when email is not found", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    await expect(
      loginUser({ email: "unknown@example.com", password: "Pass@123" })
    ).rejects.toThrow(UnauthorizedError);
  });

  it("throws AppError 403 ACCOUNT_BANNED when account is banned", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ ...mockUser, isBanned: true } as never);

    await expect(loginUser({ email: "joao@example.com", password: "Pass@123" }))
      .rejects.toMatchObject({ statusCode: 403, code: "ACCOUNT_BANNED" });
  });

  it("throws AppError 403 ACCOUNT_INACTIVE when account is deactivated", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ ...mockUser, isActive: false } as never);

    await expect(loginUser({ email: "joao@example.com", password: "Pass@123" }))
      .rejects.toMatchObject({ statusCode: 403, code: "ACCOUNT_INACTIVE" });
  });

  it("throws AppError 403 EMAIL_NOT_VERIFIED when email not verified and no Google link", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      ...mockUser,
      emailVerified: null,
      googleId: null,
    } as never);

    await expect(loginUser({ email: "joao@example.com", password: "Pass@123" }))
      .rejects.toMatchObject({ statusCode: 403, code: "EMAIL_NOT_VERIFIED" });
  });

  it("throws AppError 400 GOOGLE_ONLY_ACCOUNT when user has no password", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      ...mockUser,
      passwordHash: null,
      googleId: "google_abc123",
    } as never);

    await expect(loginUser({ email: "joao@example.com", password: "Pass@123" }))
      .rejects.toMatchObject({ statusCode: 400, code: "GOOGLE_ONLY_ACCOUNT" });
  });

  it("throws UnauthorizedError when password is incorrect", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as never);
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    await expect(loginUser({ email: "joao@example.com", password: "WrongPass" }))
      .rejects.toThrow(UnauthorizedError);
  });

  it("returns tokens for valid email + password", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as never);

    const result = await loginUser({ email: "joao@example.com", password: "Pass@123" });

    expect(result.tokens.accessToken).toBe("mock_access_token");
    expect(result.tokens.refreshToken).toBe("mock_refresh_token");
    expect(result.user.userId).toBe("user_123");
  });

  it("allows login for Google-linked account with emailVerified=null", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      ...mockUser,
      emailVerified: null,
      googleId: "google_abc123",
    } as never);

    const result = await loginUser({ email: "joao@example.com", password: "Pass@123" });
    expect(result.user.userId).toBe("user_123");
  });

  it("stores a new refresh token on successful login", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as never);

    await loginUser({ email: "joao@example.com", password: "Pass@123" });

    // $transaction is called with [refreshToken.create result, user.update result]
    expect(db.$transaction).toHaveBeenCalledOnce();
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.platformMembership.findUnique).mockResolvedValue(null);
    vi.mocked(db.refreshToken.update).mockResolvedValue(mockRefreshTokenRecord as never);
    vi.mocked(db.refreshToken.create).mockResolvedValue(mockRefreshTokenRecord as never);
    vi.mocked(db.$transaction).mockImplementation((ops: any) => Promise.all(ops));
  });

  it("throws UnauthorizedError when token is not found in DB", async () => {
    vi.mocked(db.refreshToken.findUnique).mockResolvedValueOnce(null);

    await expect(refreshAccessToken("nonexistent_token"))
      .rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when token is revoked", async () => {
    vi.mocked(db.refreshToken.findUnique).mockResolvedValueOnce({
      ...mockRefreshTokenRecord,
      isRevoked: true,
    } as never);

    await expect(refreshAccessToken("revoked_token"))
      .rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError and revokes when token is expired", async () => {
    vi.mocked(db.refreshToken.findUnique).mockResolvedValueOnce({
      ...mockRefreshTokenRecord,
      expiresAt: new Date(Date.now() - 1000), // in the past
    } as never);

    await expect(refreshAccessToken("expired_token"))
      .rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isRevoked: true } })
    );
  });

  it("rotates the refresh token on success", async () => {
    vi.mocked(db.refreshToken.findUnique).mockResolvedValueOnce(mockRefreshTokenRecord as never);

    const result = await refreshAccessToken("valid_token");

    expect(result.accessToken).toBe("mock_access_token");
    expect(result.refreshToken).toBe("mock_refresh_token");
    // Old token revoked + new token created in a transaction
    expect(db.$transaction).toHaveBeenCalledOnce();
  });
});

describe("logoutUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks the refresh token as revoked", async () => {
    vi.mocked(db.refreshToken.updateMany).mockResolvedValueOnce({ count: 1 });

    await logoutUser("some_refresh_token");

    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { token: "some_refresh_token" },
      data: { isRevoked: true },
    });
  });
});
