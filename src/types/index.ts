// =============================================================================
// CORE TYPES - COMUNIDADE HUB
// =============================================================================

export type { UserRole, SubscriptionStatus, PaymentStatus, PaymentType } from "@prisma/client";

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface JWTPayload {
  sub: string; // userId
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  hasPlatform?: boolean; // true if user has an active PlatformMembership
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  hasPlatform?: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

// =============================================================================
// COMMUNITY TYPES
// =============================================================================

export interface CommunityWithStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  memberCount: number;
  isPublished: boolean;
  influencer: {
    id: string;
    displayName: string;
    user: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface AnalyticsSummary {
  mrr: number;
  mrrGrowth: number;
  activeMembers: number;
  newMembersThisMonth: number;
  churnRate: number;
  totalRevenue: number;
  revenueGrowth: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  newSubscriptions: number;
  cancellations: number;
}

export interface InfluencerRevenueStats {
  influencerId: string;
  displayName: string;
  communityName: string;
  mrr: number;
  totalMembers: number;
  totalEarnings: number;
  commissionRate: number;
}

// =============================================================================
// COMMISSION TYPES
// =============================================================================

export interface CommissionCalculation {
  grossAmount: number;
  platformFee: number;
  platformFeeAmount: number;
  netAmount: number;
  commissionRate: number;
  commissionType: string;
}

// =============================================================================
// STRIPE TYPES
// =============================================================================

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// =============================================================================
// AI TYPES
// =============================================================================

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatResponse {
  message: string;
  tokensUsed: number;
  sessionId: string;
  costUsd: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

// =============================================================================
// AI ANALYSIS TYPES
// =============================================================================

export type AIAnalysisType = "AD_CREATIVE" | "PROFILE_AUDIT" | "POST_ANALYSIS" | "SITE_ANALYSIS";
export type AIAnalysisStatus = "PENDING" | "COMPLETED" | "FAILED";
export type AIAnalysisInputType = "image" | "video" | "url";

export interface AIAnalysisResult {
  score: number;
  summary?: string;
  diagnose?: string;
  creative_readiness?: "SCALE" | "ITERATE" | "KILL";
  creative_readiness_reasoning?: string;
  breakdown?: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommended_actions: string[];
  quick_wins?: string[];
  kpis?: string[];
  copy_suggestions?: string[];
  content_strategy?: string[];
  ab_test_ideas?: string[];
}

export interface AIAnalysisSummary {
  id: string;
  type: AIAnalysisType;
  inputType: AIAnalysisInputType;
  inputUrl: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  platform: string | null;
  score: number | null;
  status: AIAnalysisStatus;
  error: string | null;
  createdAt: string;
}

export interface AIAnalysisDetail extends AIAnalysisSummary {
  result: AIAnalysisResult | null;
  tokensUsed: number;
}
