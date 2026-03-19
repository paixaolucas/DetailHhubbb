// =============================================================================
// AUTH ROUTES — Integration Tests (handler level, no HTTP server)
// Tests the actual Next.js route handlers with mocked service layer.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/services/auth/auth.service", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null), // null = not limited
}));

vi.mock("@/lib/api-helpers", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  parseBody: vi.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { loginUser, registerUser } from "@/services/auth/auth.service";
import { ConflictError, UnauthorizedError } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, url = "http://localhost/api/auth/login"): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockServiceResult = {
  user: { userId: "user_123", email: "joao@example.com", firstName: "João", lastName: "Silva", role: "COMMUNITY_MEMBER" },
  tokens: { accessToken: "mock_access", refreshToken: "mock_refresh", expiresIn: 7200 },
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 422 when body is missing required fields", async () => {
    const req = makeRequest({ email: "not-an-email" });
    const res = await loginPOST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 422 for invalid email format", async () => {
    const req = makeRequest({ email: "not-valid", password: "Pass@123" });
    const res = await loginPOST(req);
    expect(res.status).toBe(422);
  });

  it("returns 200 + tokens on successful login", async () => {
    vi.mocked(loginUser).mockResolvedValueOnce(mockServiceResult as never);
    const req = makeRequest({ email: "joao@example.com", password: "Pass@123" });
    const res = await loginPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBe("mock_access");
  });

  it("sets http-only cookies on successful login", async () => {
    vi.mocked(loginUser).mockResolvedValueOnce(mockServiceResult as never);
    const req = makeRequest({ email: "joao@example.com", password: "Pass@123" });
    const res = await loginPOST(req);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("detailhub_access_token");
    expect(setCookie).toContain("HttpOnly");
  });

  it("returns 401 when loginUser throws UnauthorizedError", async () => {
    vi.mocked(loginUser).mockRejectedValueOnce(new UnauthorizedError("Credenciais inválidas"));
    const req = makeRequest({ email: "joao@example.com", password: "Wrong" });
    const res = await loginPOST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 403 with code ACCOUNT_BANNED when account is banned", async () => {
    const { AppError } = await import("@/types");
    vi.mocked(loginUser).mockRejectedValueOnce(
      new AppError("Conta banida", 403, "ACCOUNT_BANNED")
    );
    const req = makeRequest({ email: "joao@example.com", password: "Pass@123" });
    const res = await loginPOST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("ACCOUNT_BANNED");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(loginUser).mockRejectedValueOnce(new Error("DB connection failed"));
    const req = makeRequest({ email: "joao@example.com", password: "Pass@123" });
    const res = await loginPOST(req);
    expect(res.status).toBe(500);
  });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 422 when required fields are missing", async () => {
    const req = makeRequest({ email: "joao@example.com" }, "http://localhost/api/auth/register");
    const res = await registerPOST(req);
    expect(res.status).toBe(422);
  });

  it("returns 422 when passwords do not match", async () => {
    const req = makeRequest(
      { email: "joao@example.com", password: "Pass@123", confirmPassword: "Different@1", firstName: "João", lastName: "Silva" },
      "http://localhost/api/auth/register"
    );
    const res = await registerPOST(req);
    expect(res.status).toBe(422);
  });

  it("returns 201 + tokens on successful registration", async () => {
    vi.mocked(registerUser).mockResolvedValueOnce(mockServiceResult as never);
    const req = makeRequest(
      { email: "novo@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" },
      "http://localhost/api/auth/register"
    );
    const res = await registerPOST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBe("mock_access");
  });

  it("sets http-only cookies on successful registration", async () => {
    vi.mocked(registerUser).mockResolvedValueOnce(mockServiceResult as never);
    const req = makeRequest(
      { email: "novo@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" },
      "http://localhost/api/auth/register"
    );
    const res = await registerPOST(req);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("detailhub_access_token");
    expect(setCookie).toContain("HttpOnly");
  });

  it("returns 409 when email is already registered", async () => {
    vi.mocked(registerUser).mockRejectedValueOnce(
      new ConflictError("Email já cadastrado")
    );
    const req = makeRequest(
      { email: "existente@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" },
      "http://localhost/api/auth/register"
    );
    const res = await registerPOST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(registerUser).mockRejectedValueOnce(new Error("DB down"));
    const req = makeRequest(
      { email: "novo@example.com", password: "Pass@123", confirmPassword: "Pass@123", firstName: "João", lastName: "Silva" },
      "http://localhost/api/auth/register"
    );
    const res = await registerPOST(req);
    expect(res.status).toBe(500);
  });
});
