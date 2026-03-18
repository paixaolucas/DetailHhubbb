"use client";

// =============================================================================
// Post Detail Page — wraps PostDetail component with auth guard
// Route: /community/[communitySlug]/posts/[postId]
// =============================================================================

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PostDetail from "@/components/feed/PostDetail";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;
  const postId = params.postId as string;
  const [ready, setReady] = useState(false);

  // Auth guard — runs only on client
  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) {
      router.push(
        `/login?redirect=/community/${communitySlug}/posts/${postId}`
      );
      return;
    }
    setReady(true);
  }, [communitySlug, postId, router]);

  if (!ready) {
    // Minimal loading state while checking auth
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <span className="w-8 h-8 border-[3px] border-[#009CD9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <Suspense>
        <PostDetail postId={postId} communitySlug={communitySlug} />
      </Suspense>
    </div>
  );
}
