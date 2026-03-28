"use client";

// =============================================================================
// Community Feed Page — aggregated posts feed with cursor-based pagination
// Route: /community/[communitySlug]/feed
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Eye,
  AlertCircle,
  MessageSquare,
  Pin,
  TrendingUp,
} from "lucide-react";
import PostComposer from "@/components/feed/PostComposer";
import { STORAGE_KEYS } from "@/lib/constants";

interface FeedPost {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  space: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
}

interface Space {
  id: string;
  name: string;
  slug: string;
  type?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "agora";
  if (diffMins < 60) return `há ${diffMins}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;

  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function getAuthorInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/10 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/10 rounded w-20" />
        </div>
      </div>
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-3 bg-white/10 rounded w-full mb-1" />
      <div className="h-3 bg-white/10 rounded w-5/6" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post card
// ---------------------------------------------------------------------------

function PostCard({
  post,
  communitySlug,
}: {
  post: FeedPost;
  communitySlug: string;
}) {
  const initials = getAuthorInitials(post.author.firstName, post.author.lastName);
  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const spaceLabel = `${post.space.icon ?? ""}${post.space.icon ? " " : "#"}${post.space.name}`;

  return (
    <Link
      href={`/community/${communitySlug}/posts/${post.id}`}
      className="block bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all group"
    >
      {/* Author + meta */}
      <div className="flex items-center gap-3 mb-3">
        {post.author.avatarUrl ? (
          <Image
            src={post.author.avatarUrl}
            alt={authorName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#EEE6E4] truncate">{authorName}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/community/${communitySlug}/feed/${post.space.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[#009CD9] hover:text-[#007A99] transition-colors"
            >
              {spaceLabel}
            </Link>
            <span className="text-gray-600 text-xs">&middot;</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
        {post.isPinned && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 flex-shrink-0">
            <Pin className="w-2.5 h-2.5" />
            Fixado
          </span>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="font-semibold text-[#EEE6E4] mb-1.5 group-hover:text-[#009CD9] transition-colors">
          {post.title}
        </h2>
      )}

      {/* Body */}
      {post.body && (
        <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed">{post.body}</p>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.08]">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Heart className="w-3.5 h-3.5" />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <MessageCircle className="w-3.5 h-3.5" />
          {post.commentCount}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Eye className="w-3.5 h-3.5" />
          {post.viewCount}
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Trending sidebar
// ---------------------------------------------------------------------------

function TrendingSidebar({
  posts,
  communitySlug,
}: {
  posts: FeedPost[];
  communitySlug: string;
}) {
  const top5 = [...posts]
    .sort((a, b) => b.likeCount * 2 + b.commentCount * 3 - (a.likeCount * 2 + a.commentCount * 3))
    .slice(0, 5);

  if (top5.length === 0) return null;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#009CD9]" />
        <h3 className="text-sm font-bold text-[#EEE6E4]">Publicações em alta</h3>
      </div>
      <div className="space-y-3">
        {top5.map((post, i) => {
          const authorName = `${post.author.firstName} ${post.author.lastName}`;
          const displayText = post.title ?? (post.body?.slice(0, 80) ?? "");
          return (
            <Link
              key={post.id}
              href={`/community/${communitySlug}/posts/${post.id}`}
              className="flex items-start gap-2.5 group"
            >
              <span className="text-xs font-bold text-gray-600 mt-0.5 w-4 flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#EEE6E4] font-medium line-clamp-2 leading-snug group-hover:text-[#009CD9] transition-colors">
                  {displayText}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-500 truncate">{authorName}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
                    <Heart className="w-2.5 h-2.5" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
                    <MessageCircle className="w-2.5 h-2.5" />
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunityFeedPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // For PostComposer
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [defaultSpaceId, setDefaultSpaceId] = useState<string | null>(null);

  // Fetch community overview for composer
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    fetch(`/api/communities/${communitySlug}/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        setCommunityId(json.data.community?.id ?? null);
        const spaces: Space[] = json.data.spaces ?? [];
        const first = spaces.find((s) => !s.type || s.type !== "COURSE");
        if (first) setDefaultSpaceId(first.id);
      })
      .catch(() => {});
  }, [communitySlug]);

  const fetchPosts = useCallback(
    async (currentCursor: string | null, append: boolean) => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        router.push(`/login?redirect=/community/${communitySlug}/feed`);
        return;
      }

      const url = new URL(
        `/api/communities/${communitySlug}/feed`,
        window.location.origin
      );
      url.searchParams.set("limit", "20");
      if (currentCursor) url.searchParams.set("cursor", currentCursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = res.ok ? await res.json() : { success: false };

      if (!json.success) {
        if (!append) setError("Não foi possível carregar o feed.");
        return;
      }

      const newPosts: FeedPost[] = json.data?.posts ?? json.data ?? [];
      const nextCursor: string | null = json.data?.nextCursor ?? null;
      const more: boolean = json.data?.hasMore ?? nextCursor !== null;

      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setCursor(nextCursor);
      setHasMore(more);
    },
    [communitySlug, router]
  );

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      setError("");
      try {
        await fetchPosts(null, false);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
    initialLoad();
  }, [fetchPosts]);

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPosts(cursor, true);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  function handleNewPost(newPost: unknown) {
    setPosts((prev) => [newPost as FeedPost, ...prev]);
  }

  // Sort: pinned first, then by date descending
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            href="/inicio"
            className="text-xs text-gray-400 hover:text-[#EEE6E4] transition-colors"
          >
            &larr; Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#EEE6E4]">
      <div className="flex flex-col lg:flex-row gap-6 px-4 py-6 max-w-5xl mx-auto">

        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Post composer */}
          {communityId && defaultSpaceId && (
            <PostComposer
              spaceId={defaultSpaceId}
              communityId={communityId}
              onPost={handleNewPost}
            />
          )}

          {sortedPosts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-16 text-center">
              <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma publicação ainda</p>
              <p className="text-gray-500 text-sm mt-1">
                Seja o primeiro a postar nesta comunidade.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {sortedPosts.map((post) => (
                  <PostCard key={post.id} post={post} communitySlug={communitySlug} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-[2px] border-[#009CD9] border-t-transparent rounded-full animate-spin inline-block" />
                        Carregando...
                      </span>
                    ) : (
                      "Carregar mais"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar — full width on mobile, fixed width on desktop */}
        {posts.length > 0 && (
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <TrendingSidebar posts={sortedPosts} communitySlug={communitySlug} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
