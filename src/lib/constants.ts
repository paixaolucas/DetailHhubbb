// =============================================================================
// APPLICATION CONSTANTS
// Central place for magic values and namespaced keys
// =============================================================================

// ─── localStorage Keys (namespaced) ──────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "detailhub_access_token",
  REFRESH_TOKEN: "detailhub_refresh_token",
  USER_ROLE: "detailhub_user_role",
  USER_NAME: "detailhub_user_name",
  USER_EMAIL: "detailhub_user_email",
  USER_ID: "detailhub_user_id",
  PLATFORM_CONFIG: "detailhub_platform_config",
  PLATFORM_FLAGS: "detailhub_platform_flags",
} as const;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ─── Search ───────────────────────────────────────────────────────────────────
export const MAX_SEARCH_QUERY_LENGTH = 200;
export const VALID_SEARCH_TYPES = ["communities", "posts", "members"] as const;
export type SearchType = (typeof VALID_SEARCH_TYPES)[number];

// ─── Post limits ─────────────────────────────────────────────────────────────
export const MAX_POST_TITLE_LENGTH = 200;
export const MAX_POST_BODY_LENGTH = 50_000;
export const MAX_POST_ATTACHMENTS = 10;

// ─── Rate limiting ────────────────────────────────────────────────────────────
export const RATE_LIMIT = {
  AUTH: { windowMs: 60_000, max: 10 },      // 10 req/min per IP
  AI_CHAT: { windowMs: 60_000, max: 20 },   // 20 req/min per userId
  SEARCH: { windowMs: 60_000, max: 30 },    // 30 req/min per userId
} as const;
