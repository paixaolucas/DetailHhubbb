"use client";

// =============================================================================
// Public member profile — /community/[communitySlug]/members/[userId]
// Shows avatar, bio, car info, badges and recent posts
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Car, MessageCircle, ThumbsUp, Calendar, ExternalLink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  userId: string;
  bio?: string | null;
  location?: string | null;
  carBrand?: string | null;
  carModel?: string | null;
  carYear?: number | null;
  interests?: string[];
  socialLinks?: Record<string, string>;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    createdAt: string;
    role: string;
  };
}

interface Post {
  id: string;
  title?: string | null;
  body: string;
  type: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  _count?: { reactions?: number; comments?: number };
  space?: {
    name: string;
    slug: string;
    community: { name: string; slug: string };
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD < 1) return "hoje";
  if (diffD < 7) return `há ${diffD} dia${diffD !== 1 ? "s" : ""}`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 4) return `há ${diffW} semana${diffW !== 1 ? "s" : ""}`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo < 12) return `há ${diffMo} ${diffMo !== 1 ? "meses" : "mês"}`;
  const diffY = Math.floor(diffMo / 12);
  return `há ${diffY} ano${diffY !== 1 ? "s" : ""}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  INFLUENCER_ADMIN: "Criador",
  COMMUNITY_MEMBER: "Membro",
  MARKETPLACE_PARTNER: "Parceiro",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-5">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-3.5 bg-gray-100 rounded w-1/4" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mt-3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("detailhub_access_token");
        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/members/${userId}`);
          return;
        }

        const [profileRes, postsRes] = await Promise.all([
          fetch(`/api/users/${userId}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/users/${userId}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileJson = await profileRes.json();
        const postsJson = await postsRes.json();

        if (!profileRes.ok || (!profileJson.success && profileRes.status === 404)) {
          setNotFound(true);
          return;
        }

        setProfile(profileJson.data ?? null);
        if (postsJson.success) setPosts(postsJson.data ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, communitySlug, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-40 animate-pulse" />
        <ProfileSkeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-sm">Perfil não encontrado.</p>
        <Link
          href={`/community/${communitySlug}/feed`}
          className="text-xs text-violet-500 hover:underline mt-2 inline-block"
        >
          ← Voltar ao feed
        </Link>
      </div>
    );
  }

  const fullName = profile
    ? `${profile.user.firstName} ${profile.user.lastName}`
    : "Membro";
  const initials = profile
    ? `${profile.user.firstName[0] ?? ""}${profile.user.lastName[0] ?? ""}`.toUpperCase()
    : "?";
  const roleLabel = profile ? (ROLE_LABELS[profile.user.role] ?? "Membro") : "Membro";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Back link */}
      <Link
        href={`/community/${communitySlug}/feed`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao feed
      </Link>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {profile?.user.avatarUrl ? (
            <img
              src={profile.user.avatarUrl}
              alt={fullName}
              className="w-20 h-20 rounded-2xl object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-violet-600/80 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{fullName}</h1>
              <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                {roleLabel}
              </span>
            </div>
            {profile?.user.createdAt && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Membro desde {formatDate(profile.user.createdAt)}
              </p>
            )}
            {profile?.bio && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Details row */}
        {(profile?.location || profile?.carBrand || profile?.carModel) && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {profile?.location && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {profile.location}
              </span>
            )}
            {(profile?.carBrand || profile?.carModel) && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Car className="w-3.5 h-3.5 text-gray-400" />
                {[profile?.carBrand, profile?.carModel, profile?.carYear].filter(Boolean).join(" ")}
              </span>
            )}
          </div>
        )}

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Social links */}
        {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(profile.socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {platform}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Publicações recentes{posts.length > 0 ? ` (${posts.length})` : ""}
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma publicação ainda.</p>
          </div>
        ) : (
          posts.map((post) => {
            const commentCount = post._count?.comments ?? post.commentCount;
            const likeCount = post._count?.reactions ?? post.likeCount;
            const communityLink = post.space?.community?.slug
              ? `/community/${post.space.community.slug}/posts/${post.id}`
              : `/community/${communitySlug}/posts/${post.id}`;

            return (
              <Link
                key={post.id}
                href={communityLink}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Space badge */}
                {post.space && (
                  <p className="text-xs text-violet-500 font-medium mb-1.5">
                    #{post.space.name}
                    {post.space.community.slug !== communitySlug && (
                      <span className="text-gray-400 ml-1">· {post.space.community.name}</span>
                    )}
                  </p>
                )}

                {post.title && (
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
                    {post.title}
                  </h3>
                )}
                {post.body && post.body.trim() !== " " && (
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {post.body}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                    <ThumbsUp className="w-3 h-3" />
                    {likeCount}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageCircle className="w-3 h-3" />
                    {commentCount}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
