// =============================================================================
// COMMUNITY VALIDATION SCHEMAS
// =============================================================================

import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color");

export const createCommunitySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(80),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(160).optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  accentColor: hexColor.optional(),
  isPrivate: z.boolean().optional().default(false),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  welcomeMessage: z.string().max(5000).optional(),
  rules: z.string().max(5000).optional(),
});

export const updateCommunitySchema = createCommunitySchema.partial().extend({
  isPublished: z.boolean().optional(),
  maxMembers: z.number().int().positive().optional().nullable(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
});

export const createSubscriptionPlanSchema = z.object({
  communityId: z.string().cuid(),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  price: z.number().positive().max(99999),
  currency: z.string().length(3).toLowerCase().default("brl"),
  intervalCount: z.number().int().min(1).max(12).default(1),
  interval: z.enum(["day", "week", "month", "year"]).default("month"),
  trialDays: z.number().int().min(0).max(90).default(0),
  features: z.array(z.string().max(200)).max(20).default([]),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  maxMembers: z.number().int().positive().optional(),
  hasContentAccess: z.boolean().default(true),
  hasLiveAccess: z.boolean().default(true),
  hasCommunityAccess: z.boolean().default(true),
});

// Used by the plans route (consolidating local schema)
export const createPlanRouteSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive().max(99999),
  interval: z.enum(["month", "year"]).default("month"),
  intervalCount: z.number().int().positive().default(1),
  features: z.array(z.string().max(200)).max(20).default([]),
  trialDays: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export const updatePlanRouteSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type CreateSubscriptionPlanInput = z.infer<
  typeof createSubscriptionPlanSchema
>;
export type CreatePlanRouteInput = z.infer<typeof createPlanRouteSchema>;
