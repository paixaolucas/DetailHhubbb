"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface TrendingPost {
  id: string;
  title: string | null;
  body: string;
  type: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  community: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    logoUrl: string | null;
  };
  spaceSlug: string | null;
}


function PostSkeleton() {
  return (
    <div className="p-4 animate-pulse space-y-3 border-b border-white/[0.06] last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-white/10" />
        <div className="h-3 bg-white/10 rounded w-20" />
      </div>
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-2/3" />
    </div>
  );
}

function PostCard({ post }: { post: TrendingPost }) {
  const postHref = `/community/${post.community.slug}/posts/${post.id}`;
  const displayTitle = post.title ?? post.body.slice(0, 80);

  return (
    <div className="px-5 py-4 border-b border-white/[0.06] last:border-0 space-y-2.5 hover:bg-white/[0.02] transition-colors">
      {/* Community + Author */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {post.community.logoUrl ? (
            <Image
              src={post.community.logoUrl}
              alt={post.community.name}
              width={16}
              height={16}
              className="w-4 h-4 rounded object-cover"
            />
          ) : (
            <div
              className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: post.community.primaryColor }}
            >
              {post.community.name[0]}
            </div>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${post.community.primaryColor}20`,
              color: post.community.primaryColor,
            }}
          >
            {post.community.name}
          </span>
        </div>
        <span className="text-gray-700 text-xs">·</span>
        <div className="flex items-center gap-1.5">
          {post.author.avatarUrl ? (
            <Image src={post.author.avatarUrl} alt={post.author.name} width={16} height={16} className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-[#006079]/60 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
              {post.author.name[0]}
            </div>
          )}
          <span className="text-xs text-gray-500">{post.author.name}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-base font-semibold text-[#EEE6E4] leading-snug line-clamp-2">
        {displayTitle}
      </p>

      {/* Engagement + Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="flex items-center gap-1 text-sm">
            <Heart className="w-3.5 h-3.5" /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1 text-sm">
            <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
          </span>
        </div>
        <Link
          href={postHref}
          className="text-sm text-[#009CD9] font-medium hover:underline"
        >
          Ver na comunidade →
        </Link>
      </div>
    </div>
  );
}

export function TrendingFeed() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta últimos 7 dias; se vazio, tenta 30 dias
    apiClient<TrendingPost[]>("/api/posts/trending?limit=5&hours=168")
      .then(async (d) => {
        if (d.success) {
          const fetched = d.data ?? [];
          if (fetched.length > 0) { setPosts(fetched); return; }
          const d2 = await apiClient<TrendingPost[]>("/api/posts/trending?limit=5&hours=720");
          if (d2.success) setPosts(d2.data ?? []);
        }
      })
      .catch(() => {}) // sem mock — mostra empty state
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <TrendingUp className="w-5 h-5 text-[#009CD9]" />
        <h2 className="text-xl font-bold text-[#EEE6E4]">Em alta nas comunidades</h2>
      </div>

      {loading ? (
        <div className="divide-y divide-white/[0.06]">
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <TrendingUp className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">Ainda sem posts em alta</p>
          <p className="text-xs text-gray-600 mt-1">Explore as comunidades e seja o primeiro a engajar!</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
