"use client";

// =============================================================================
// LeaderboardRedirect — redirects legacy /leaderboard route to /members?tab=ranking
// =============================================================================

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LeaderboardRedirect() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;

  useEffect(() => {
    router.replace(`/community/${communitySlug}/members?tab=ranking`);
  }, [communitySlug, router]);

  return null;
}
