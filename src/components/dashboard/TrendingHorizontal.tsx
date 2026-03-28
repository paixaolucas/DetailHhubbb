"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronUp, Heart, MessageCircle, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface TrendingPost {
  id: string;
  title: string | null;
  body: string;
  likeCount: number;
  commentCount: number;
  community: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    logoUrl: string | null;
  };
  author: { id: string; name: string; avatarUrl: string | null };
}

function PostCardSkeleton() {
  return (
    <div className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-white/10" />
        <div className="h-3 bg-white/10 rounded w-24" />
      </div>
      <div className="h-4 bg-white/10 rounded w-full" />
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-4 bg-white/10 rounded w-1/2" />
      <div className="flex gap-3 mt-2">
        <div className="h-3 bg-white/10 rounded w-10" />
        <div className="h-3 bg-white/10 rounded w-10" />
      </div>
    </div>
  );
}

function TrendingPostCard({ post }: { post: TrendingPost }) {
  const displayText = post.title ?? post.body.slice(0, 120);

  return (
    <Link
      href={`/community/${post.community.slug}/posts/${post.id}`}
      className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-4 hover:border-white/20 transition-colors block"
    >
      {/* Community chip */}
      <div className="flex items-center gap-1.5 mb-2">
        {post.community.logoUrl ? (
          <Image
            src={post.community.logoUrl}
            alt={post.community.name}
            width={12}
            height={12}
            className="w-3 h-3 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-3 h-3 rounded flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
            style={{ backgroundColor: post.community.primaryColor }}
          >
            {post.community.name[0]}
          </div>
        )}
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[140px]"
          style={{
            backgroundColor: `${post.community.primaryColor}20`,
            color: post.community.primaryColor,
          }}
        >
          {post.community.name}
        </span>
      </div>

      {/* Title / body */}
      <p className="text-sm font-semibold text-[#EEE6E4] line-clamp-3 leading-snug">
        {displayText}
      </p>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-gray-500 mt-3">
        <span className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5" />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" />
          {post.commentCount}
        </span>
      </div>
    </Link>
  );
}

export function TrendingHorizontal() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    apiClient<TrendingPost[]>("/api/posts/trending?limit=8&hours=168")
      .then(async (d) => {
        if (d.success) {
          const fetched = d.data ?? [];
          if (fetched.length > 0) {
            setPosts(fetched);
            return;
          }
          const d2 = await apiClient<TrendingPost[]>("/api/posts/trending?limit=8&hours=720");
          if (d2.success) setPosts(d2.data ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-5">
      {/* Header */}
      <div className={`flex items-center gap-2 ${collapsed ? "" : "mb-4"}`}>
        <TrendingUp className="w-5 h-5 text-[#009CD9]" />
        <h2 className="text-base font-bold text-[#EEE6E4]">Em alta</h2>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
          title={collapsed ? "Expandir" : "Minimizar"}
        >
          <ChevronUp className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Grid responsivo — 1 col mobile, 2 col tablet, 4 col desktop */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {loading
            ? [1, 2, 3, 4].map((i) => <PostCardSkeleton key={i} />)
            : posts.slice(0, 8).map((post) => (
                <TrendingPostCard key={post.id} post={post} />
              ))}
        </div>
      )}
    </div>
  );
}
