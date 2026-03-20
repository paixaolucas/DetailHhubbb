// =============================================================================
// POST VALIDATION SCHEMAS
// =============================================================================

import { z } from "zod";
import {
  MAX_POST_TITLE_LENGTH,
  MAX_POST_BODY_LENGTH,
  MAX_POST_ATTACHMENTS,
} from "@/lib/constants";

export const POST_TYPES = ["TEXT", "IMAGE", "LINK", "POLL", "VIDEO"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const createPostSchema = z.object({
  title: z.string().max(MAX_POST_TITLE_LENGTH).optional(),
  body: z
    .string()
    .max(MAX_POST_BODY_LENGTH, `O post deve ter no máximo ${MAX_POST_BODY_LENGTH} caracteres`)
    .optional()
    .default(""),
  type: z.enum(POST_TYPES).default("TEXT"),
  attachments: z.array(
    z.union([
      z.string().url(),
      z.object({ url: z.string().url(), name: z.string(), size: z.number().optional() }),
    ])
  ).max(MAX_POST_ATTACHMENTS).optional().default([]),
  videoUrl: z.string().url("URL de vídeo inválida").optional(),
  videoAspect: z.enum(["16:9", "9:16", "4:3"]).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
