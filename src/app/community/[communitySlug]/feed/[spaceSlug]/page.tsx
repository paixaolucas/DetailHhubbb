"use client";

// =============================================================================
// Space Feed Page — shows posts for a specific space with sidebar, composer
// Fetches community → spaces → posts in sequence on mount
// Supports cursor-based "Load more" pagination
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { SpaceItem } from "@/components/feed/SpaceSidebar";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;
}

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface Post {
  id: string;
  title?: string | null;
  body: string;
  type: string;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: PostAuthor;
  reactionCounts?: Record<string, number>;
  userReactions?: string[];
  _count?: { reactions?: number; comments?: number };
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gray-50 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-50 rounded w-28" />
          <div className="h-3 bg-gray-50 rounded w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-50 rounded" />
        <div className="h-4 bg-gray-50 rounded w-5/6" />
        <div className="h-4 bg-gray-50 rounded w-3/4" />
      </div>
      <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="h-3 bg-gray-50 rounded w-12" />
        <div className="h-3 bg-gray-50 rounded w-12" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SpaceFeedPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;
  const spaceSlug = params.spaceSlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceItem | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isOwner, setIsOwner] = useState(false);

  // ---------------------------------------------------------------------------

  const fetchPosts = useCallback(
    async (spaceId: string, cursor?: string) => {
      const isLoadMore = !!cursor;
      isLoadMore ? setLoadingMore(true) : setPostsLoading(true);

      try {
        const token = localStorage.getItem("detailhub_access_token");
        const url = cursor
          ? `/api/spaces/${spaceId}/posts?cursor=${cursor}&limit=20`
          : `/api/spaces/${spaceId}/posts?limit=20`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (json.success) {
          const newPosts: Post[] = json.data.posts ?? [];
          // Pinned posts always appear first
          const sorted = (isLoadMore ? newPosts : newPosts).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
          });
          setPosts((prev) => (isLoadMore ? [...prev, ...sorted] : sorted));
          setNextCursor(json.data.nextCursor ?? null);
        }
      } catch {
        // silent — posts loading failure is non-critical
      } finally {
        isLoadMore ? setLoadingMore(false) : setPostsLoading(false);
      }
    },
    []
  );

  // Main data load
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("detailhub_access_token");
        const uid = localStorage.getItem("detailhub_user_id");
        setCurrentUserId(uid ?? undefined);

        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/feed/${spaceSlug}`);
          return;
        }

        // 1. Find community by slug from mine (influencer-owned)
        const mineRes = await fetch("/api/communities/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mineJson = await mineRes.json();
        let found: Community | null = null;

        if (mineJson.success && Array.isArray(mineJson.data)) {
          found = mineJson.data.find((c: Community) => c.slug === communitySlug) ?? null;
        }

        // Fallback: role-based access for members and admins
        if (!found) {
          const role = localStorage.getItem("detailhub_user_role");
          const pubRes = await fetch("/api/communities?published=true", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pubJson = await pubRes.json();
          const allCommunities: Community[] = pubJson.success ? (pubJson.communities ?? []) : [];
          const candidate = allCommunities.find((c: Community) => c.slug === communitySlug);
          if (candidate && (role === "SUPER_ADMIN" || role === "COMMUNITY_MEMBER" || role === "INFLUENCER_ADMIN")) {
            found = candidate;
          }
        }

        if (!found) {
          setError("Comunidade não encontrada ou você não tem acesso.");
          setLoading(false);
          return;
        }
        setCommunity(found);

        // 2. Check if current user is the community owner or SUPER_ADMIN
        const role = localStorage.getItem("detailhub_user_role");
        if (role === "SUPER_ADMIN") {
          setIsOwner(true);
        } else {
          try {
            const detailRes = await fetch(`/api/communities/${found.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const detailJson = await detailRes.json();
            if (detailJson.success && detailJson.data?.influencer?.userId === uid) {
              setIsOwner(true);
            }
          } catch {
            // non-critical
          }
        }

        // 2. Fetch spaces
        const spacesRes = await fetch(`/api/communities/${found.id}/spaces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const spacesJson = await spacesRes.json();
        const spaceList: SpaceItem[] = spacesJson.data ?? [];
        setSpaces(spaceList);

        // 3. Find active space
        const space = spaceList.find((s) => s.slug === spaceSlug) ?? null;
        setActiveSpace(space);

        if (space) {
          await fetchPosts(space.id);
        }
      } catch {
        setError("Erro de conexão. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [communitySlug, spaceSlug, router, fetchPosts]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleNewPost(post: unknown) {
    setPosts((prev) => [post as Post, ...prev]);
  }

  async function handleReact(postId: string, type: string) {
    const token = localStorage.getItem("detailhub_access_token");
    const res = await fetch(`/api/posts/${postId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type }),
    });
    const json = await res.json();
    if (json.success) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const reacted: boolean = json.data.reacted;
          return {
            ...p,
            reactionCounts: {
              ...p.reactionCounts,
              [type]: reacted
                ? (p.reactionCounts?.[type] ?? 0) + 1
                : Math.max(0, (p.reactionCounts?.[type] ?? 1) - 1),
            },
            userReactions: reacted
              ? [...(p.userReactions ?? []), type]
              : (p.userReactions ?? []).filter((r) => r !== type),
          };
        })
      );
    }
  }

  async function handleLoadMore() {
    if (!activeSpace || !nextCursor) return;
    await fetchPosts(activeSpace.id, nextCursor);
  }

  function handlePostDelete(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handlePostUpdate(updated: { id: string; isPinned?: boolean; isHidden?: boolean }) {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
      // Re-sort so pinned posts stay on top
      return next.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (!loading && error) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            href={`/community/${communitySlug}/feed`}
            className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            ← Voltar aos canais
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="text-gray-900">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Feed column */}
        <main className="flex flex-col gap-4">
          {/* Community banner */}
          {!loading && community?.bannerUrl && (
            <div className="relative h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img src={community.bannerUrl} alt={community.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-5 gap-3">
                {community.logoUrl ? (
                  <img src={community.logoUrl} alt={community.name} className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0"
                    style={{ backgroundColor: community.primaryColor ?? "#8B5CF6" }}
                  >
                    {community.name.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-gray-900 text-sm drop-shadow">{community.name}</span>
              </div>
            </div>
          )}

          {/* Space header */}
          {!loading && activeSpace && (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
              <span className="text-xl">
                {activeSpace.icon ?? "#"}
              </span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeSpace.name}</p>
                {activeSpace.type && (
                  <p className="text-xs text-gray-500">
                    {({ DISCUSSION: "Discussão", ANNOUNCEMENT: "Avisos", QA: "Perguntas", SHOWCASE: "Showcase" } as Record<string, string>)[activeSpace.type] ?? activeSpace.type}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Composer */}
          {!loading && activeSpace && (
            <PostComposer spaceId={activeSpace.id} onPost={handleNewPost} />
          )}

          {/* Posts */}
          {(loading || postsLoading) ? (
            Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-500 text-sm">Nenhuma publicação ainda.</p>
              <p className="text-gray-700 text-xs mt-1">
                Seja o primeiro a postar neste canal!
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  communitySlug={communitySlug}
                  spaceSlug={spaceSlug}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  onReact={(type) => handleReact(post.id, type)}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                />
              ))}

              {nextCursor && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais"
                  )}
                </button>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
