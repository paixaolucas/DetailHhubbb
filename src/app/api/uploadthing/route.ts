// =============================================================================
// UploadThing route handler
// =============================================================================

import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/upload";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
