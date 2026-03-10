// =============================================================================
// UPLOAD HELPER — UploadThing integration
// =============================================================================

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { withAuth } from "@/middleware/auth.middleware";

const f = createUploadthing();

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // UploadThing middleware: validate auth
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  communityImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  postAttachmentUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
