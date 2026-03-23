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

const MOCK_POSTS: TrendingPost[] = [
  {
    id: "mock-1",
    title: "Como preparar seu carro para o verão",
    body: "Dicas essenciais de detailing para os meses mais quentes do ano.",
    type: "TEXT",
    likeCount: 42,
    commentCount: 8,
    viewCount: 310,
    createdAt: new Date().toISOString(),
    author: { id: "u1", name: "João Silva", avatarUrl: null },
    community: { id: "c1", name: "Detailing Pro", slug: "detailing-pro", primaryColor: "#009CD9", logoUrl: null },
    spaceSlug: "feed",
  },
  {
    id: "mock-2",
    title: "Vitrificação vs Cristalização: qual escolher?",
    body: "Um comparativo completo dos dois processos mais populares.",
    type: "TEXT",
    likeCount: 31,
    commentCount: 14,
    viewCount: 220,
    createdAt: new Date().toISOString(),
    author: { id: "u2", name: "Carlos Mendes", avatarUrl: null },
    community: { id: "c2", name: "AutoCare BR", slug: "autocare-br", primaryColor: "#006079", logoUrl: null },
    spaceSlug: "feed",
  },
  {
    id: "mock-3",
    title: "Produtos que valem cada centavo",
    body: "Review honesto dos melhores produtos de polimento do mercado.",
    type: "TEXT",
    likeCount: 27,
    commentCount: 6,
    viewCount: 180,
    createdAt: new Date().toISOString(),
    author: { id: "u3", name: "Marcos Lima", avatarUrl: null },
    community: { id: "c3", name: "Polimento Total", slug: "polimento-total", primaryColor: "#007A99", logoUrl: null },
    spaceSlug: "feed",
  },
];

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
  const postHref = post.spaceSlug
    ? `/community/${post.community.slug}/${post.spaceSlug}/${post.id}`
    : `/community/${post.community.slug}/feed`;
  const displayTitle = post.title ?? post.body.slice(0, 80);

  return (
    <div className="p-4 border-b border-white/[0.06] last:border-0 space-y-2 hover:bg-white/[0.02] transition-colors">
      {/* Community + Author */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {post.community.logoUrl ? (
            <Image
              src={post.community.logoUrl}
              alt={post.community.name}
              width={14}
              height={14}
              className="w-3.5 h-3.5 rounded object-cover"
            />
          ) : (
            <div
              className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[7px] font-bold"
              style={{ backgroundColor: post.community.primaryColor }}
            >
              {post.community.name[0]}
            </div>
          )}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${post.community.primaryColor}20`,
              color: post.community.primaryColor,
            }}
          >
            {post.community.name}
          </span>
        </div>
        <span className="text-gray-700 text-[10px]">·</span>
        <span className="text-[10px] text-gray-500">{post.author.name}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-[#EEE6E4] leading-tight line-clamp-2">
        {displayTitle}
      </p>

      {/* Engagement + Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-600">
          <span className="flex items-center gap-1 text-[11px]">
            <Heart className="w-3 h-3" /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <MessageCircle className="w-3 h-3" /> {post.commentCount}
          </span>
        </div>
        <Link
          href={postHref}
          className="text-[11px] text-[#009CD9] font-medium hover:underline"
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
    apiClient<TrendingPost[]>("/api/posts/trending?limit=5&hours=48")
      .then((d) => {
        if (d.success) {
          const fetched = d.data ?? [];
          if (fetched.length === 0 && process.env.NODE_ENV === "development") {
            setPosts(MOCK_POSTS);
          } else {
            setPosts(fetched);
          }
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === "development") setPosts(MOCK_POSTS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-bold text-[#EEE6E4] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#009CD9]" />
          Em alta agora
        </h2>
        <Link
          href="/dashboard"
          className="text-xs text-[#009CD9] font-medium hover:underline"
        >
          Ver mais →
        </Link>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {loading
          ? [1, 2, 3].map((i) => <PostSkeleton key={i} />)
          : posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
