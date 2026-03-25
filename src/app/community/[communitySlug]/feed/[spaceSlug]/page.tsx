"use client";

// =============================================================================
// Space Feed Page — shows posts for a specific space with sidebar, composer
// Fetches community → spaces → posts in sequence on mount
// Supports cursor-based "Load more" pagination
// =============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowUp } from "lucide-react";
import { SpaceItem } from "@/components/feed/SpaceSidebar";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import { STORAGE_KEYS } from "@/lib/constants";

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
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-white/10 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-white/10 rounded w-28" />
          <div className="h-3 bg-white/10 rounded w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
      </div>
      <div className="flex gap-4 mt-4 pt-3 border-t border-white/5">
        <div className="h-3 bg-white/10 rounded w-12" />
        <div className="h-3 bg-white/10 rounded w-12" />
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isOwner, setIsOwner] = useState(false);

  // Live feed state
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const postsRef = useRef<Post[]>([]);


  // ---------------------------------------------------------------------------

  // Used only for "load more" (cursor-based pagination)
  const fetchMorePosts = useCallback(
    async (spaceId: string, cursor: string) => {
      setLoadingMore(true);
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(
          `/api/spaces/${spaceId}/posts?cursor=${cursor}&limit=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.success) {
          const newPosts: Post[] = json.data.posts ?? [];
          setPosts((prev) => [...prev, ...newPosts]);
          setNextCursor(json.data.nextCursor ?? null);
        }
      } catch {
        // non-critical
      } finally {
        setLoadingMore(false);
      }
    },
    []
  );

  // Main data load — single round-trip via combined endpoint
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        setCurrentUserId(uid ?? undefined);

        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/feed/${spaceSlug}`);
          return;
        }

        const res = await fetch(
          `/api/communities/${communitySlug}/space/${spaceSlug}/posts?limit=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "Comunidade não encontrada ou você não tem acesso.");
          setLoading(false);
          return;
        }

        const { community, spaces, activeSpace, isOwner, posts: initialPosts, nextCursor: initialCursor } = json.data;

        setCommunity(community);
        setSpaces(spaces);
        setActiveSpace(activeSpace);
        setIsOwner(isOwner);
        setPosts(initialPosts ?? []);
        setNextCursor(initialCursor ?? null);
        setLoading(false);
      } catch {
        setError("Erro de conexão. Tente novamente.");
        setLoading(false);
      }
    }

    load();
  }, [communitySlug, spaceSlug, router]);

  // Keep postsRef in sync so the polling interval always sees latest posts
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // ---------------------------------------------------------------------------
  // Live polling — check for new posts every 10 s
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!activeSpace) return;

    const poll = async () => {
      const current = postsRef.current;
      if (current.length === 0) return;
      // Use the newest non-pinned post as the reference point
      const ref = current.find((p) => !p.isPinned) ?? current[0];
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      try {
        const res = await fetch(
          `/api/spaces/${activeSpace.id}/posts?newerThan=${encodeURIComponent(ref.createdAt)}&limit=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.success) {
          const fresh: Post[] = json.data.posts ?? [];
          if (fresh.length > 0) {
            const existingIds = new Set(postsRef.current.map((p) => p.id));
            const brandNew = fresh.filter((p) => !existingIds.has(p.id));
            if (brandNew.length > 0) {
              setPendingPosts(brandNew);
            }
          }
        }
      } catch {
        // polling failure is non-critical
      }
    };

    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [activeSpace]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleNewPost = useCallback((post: unknown) => {
    setPosts((prev) => [post as Post, ...prev]);
    setPendingPosts([]);
  }, []);

  const handleReact = useCallback(async (postId: string, type: string) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!activeSpace || !nextCursor) return;
    await fetchMorePosts(activeSpace.id, nextCursor);
  }, [activeSpace, nextCursor, fetchMorePosts]);

  const handleLoadPending = useCallback(() => {
    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = pendingPosts.filter((p) => !existingIds.has(p.id));
      return [...toAdd, ...prev].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
    setPendingPosts([]);
  }, [pendingPosts]);

  const handlePostDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handlePostUpdate = useCallback((updated: { id: string; isPinned?: boolean; isHidden?: boolean }) => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
      // Re-sort so pinned posts stay on top
      return next.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }, []);

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
            className="text-xs text-gray-400 hover:text-[#EEE6E4] transition-colors"
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
    <div className="text-[#EEE6E4]">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Feed column */}
        <main className="flex flex-col gap-4">
          {/* Community banner */}
          {!loading && community?.bannerUrl && (
            <div className="relative h-20 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={community.bannerUrl} alt={community.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-5 gap-3">
                {community.logoUrl ? (
                  <Image src={community.logoUrl} alt={community.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: community.primaryColor ?? "#006079" }}
                  >
                    {community.name.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-white text-sm drop-shadow">{community.name}</span>
              </div>
            </div>
          )}

          {/* Space header */}
          {!loading && activeSpace && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
              <span className="text-xl">
                {activeSpace.icon ?? "#"}
              </span>
              <div>
                <p className="font-semibold text-[#EEE6E4] text-sm">{activeSpace.name}</p>
                {activeSpace.type && (
                  <p className="text-xs text-gray-400">
                    {({ DISCUSSION: "Discussão", ANNOUNCEMENT: "Avisos", QA: "Perguntas", SHOWCASE: "Showcase" } as Record<string, string>)[activeSpace.type] ?? activeSpace.type}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* New posts banner */}
          {pendingPosts.length > 0 && (
            <button
              onClick={handleLoadPending}
              className="w-full py-2.5 bg-[#006079]/20 border border-[#006079]/50 rounded-xl text-sm text-[#009CD9] hover:bg-[#006079]/30 transition-all flex items-center justify-center gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              {pendingPosts.length} nova{pendingPosts.length > 1 ? "s" : ""} publicaç{pendingPosts.length > 1 ? "ões" : "ão"} — clique para ver
            </button>
          )}

          {/* Composer */}
          {!loading && activeSpace && (
            <PostComposer spaceId={activeSpace.id} communityId={community?.id ?? ""} onPost={handleNewPost} />
          )}

          {/* Posts */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">Nenhuma publicação ainda.</p>
              <p className="text-gray-500 text-xs mt-1">
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
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-[#EEE6E4] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
