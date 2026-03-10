// =============================================================================
// POST VALIDATION SCHEMAS
// =============================================================================

import { z } from "zod";
import {
  MAX_POST_TITLE_LENGTH,
  MAX_POST_BODY_LENGTH,
  MAX_POST_ATTACHMENTS,
} from "@/lib/constants";

export const POST_TYPES = ["TEXT", "IMAGE", "LINK", "POLL"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const createPostSchema = z.object({
  title: z.string().max(MAX_POST_TITLE_LENGTH).optional(),
  body: z
    .string()
    .min(1, "O conteúdo do post é obrigatório")
    .max(MAX_POST_BODY_LENGTH, `O post deve ter no máximo ${MAX_POST_BODY_LENGTH} caracteres`),
  type: z.enum(POST_TYPES).default("TEXT"),
  attachments: z.array(z.string().url()).max(MAX_POST_ATTACHMENTS).optional().default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
