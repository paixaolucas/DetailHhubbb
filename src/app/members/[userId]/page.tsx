"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Car,
  Lock,
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Calendar,
  MessageSquare,
  Heart,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
// date-fns is not in this project — using inline helper below

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  location?: string | null;
  carBrand?: string | null;
  carModel?: string | null;
  carYear?: number | null;
  interests: string[];
  socialLinks: Record<string, string>;
  isPublic: boolean;
  createdAt: string;
  metadata?: {
    carColor?: string;
    carPower?: string;
    carFuel?: string;
    carPhotos?: string[];
  } | null;
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
  likeCount: number;
  commentCount: number;
  createdAt: string;
  space: {
    name: string;
    slug: string;
    community: {
      name: string;
      slug: string;
    };
  };
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  INFLUENCER_ADMIN: "Influencer",
  COMMUNITY_MEMBER: "Membro",
  MARKETPLACE_PARTNER: "Parceiro",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
  INFLUENCER_ADMIN: "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20",
  COMMUNITY_MEMBER: "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20",
  MARKETPLACE_PARTNER: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return <Instagram className="w-4 h-4" />;
  if (p.includes("twitter") || p.includes("x.com"))
    return <Twitter className="w-4 h-4" />;
  if (p.includes("youtube")) return <Youtube className="w-4 h-4" />;
  return <Globe className="w-4 h-4" />;
}

const PT_MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatJoinDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${PT_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return "";
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Header card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-white/5 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-6 bg-white/5 rounded w-48" />
            <div className="h-4 bg-white/5 rounded w-24" />
            <div className="h-4 bg-white/5 rounded w-64" />
          </div>
        </div>
      </div>
      {/* Posts */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2"
          >
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setIsLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          fetch(`/api/users/${userId}/profile`),
          fetch(`/api/users/${userId}/posts`),
        ]);

        if (!profileRes.ok && profileRes.status === 404) {
          setNotFound(true);
          return;
        }

        const profileData = await profileRes.json();
        const postsData = postsRes.ok ? await postsRes.json() : { data: [] };

        if (!profileData.data) {
          // Profile not created yet — user may not have set it up
          setNotFound(true);
          return;
        }

        setProfile(profileData.data);
        setPosts(postsData.data ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [userId]);

  if (isLoading) return <ProfileSkeleton />;

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#EEE6E4] font-semibold text-lg">
            Perfil não encontrado
          </p>
          <p className="text-gray-500 text-sm">
            Este usuário não existe ou ainda não configurou seu perfil.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2 bg-[#006079] hover:bg-[#004D61] text-white text-sm font-medium rounded-xl transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  // Private profile
  if (profile && !profile.isPublic) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#EEE6E4] font-semibold text-lg">
            Este perfil é privado
          </p>
          <p className="text-gray-500 text-sm">
            {profile.user.firstName} optou por manter o perfil privado.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2 bg-[#006079] hover:bg-[#004D61] text-white text-sm font-medium rounded-xl transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { user } = profile;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleColor =
    ROLE_COLORS[user.role] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  const hasCar = profile.carBrand || profile.carModel;
  const socialEntries = Object.entries(profile.socialLinks ?? {}).filter(
    ([, url]) => !!url
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile card */}
        <div className="bg-white backdrop-blur-md border border-white/10 rounded-2xl p-6 animate-fade-in">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={fullName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-[#006079] to-[#007A99] rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[#EEE6E4] font-bold text-xl leading-tight">
                  {fullName}
                </h1>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${roleColor}`}
                >
                  {roleLabel}
                </span>
              </div>

              {/* Send message */}
              {isLoggedIn && (
                <Link
                  href="/dashboard/messages"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#006079]/20 hover:bg-[#006079]/30 border border-[#007A99]/30 text-[#009CD9] hover:text-[#33A7BF] text-xs font-medium rounded-xl transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Enviar mensagem
                </Link>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {profile.location && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  Membro desde {formatJoinDate(user.createdAt)}
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Car / Garage */}
          {hasCar && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Garagem
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-300 font-medium mb-2">
                <span>
                  {[profile.carBrand, profile.carModel, profile.carYear]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </div>
              {(profile.metadata?.carColor || profile.metadata?.carFuel || profile.metadata?.carPower) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.metadata?.carColor && (
                    <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-gray-400">
                      {profile.metadata.carColor}
                    </span>
                  )}
                  {profile.metadata?.carFuel && (
                    <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-gray-400">
                      {profile.metadata.carFuel}
                    </span>
                  )}
                  {profile.metadata?.carPower && (
                    <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-gray-400">
                      {profile.metadata.carPower}
                    </span>
                  )}
                </div>
              )}
              {profile.metadata?.carPhotos && profile.metadata.carPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {profile.metadata.carPhotos.slice(0, 3).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={url}
                        alt=""
                        width={200}
                        height={80}
                        className="w-full h-20 object-cover rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          {socialEntries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3">
              {socialEntries.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-[#EEE6E4] text-xs transition-colors"
                >
                  <SocialIcon platform={platform} />
                  {platform}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Posts section */}
        <div>
          <h2 className="text-[#EEE6E4] font-semibold text-lg mb-4">
            Posts recentes
          </h2>

          {posts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center py-12 gap-2">
              <MessageSquare className="w-8 h-8 text-gray-400" />
              <p className="text-gray-500 text-sm">Nenhum post publicado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors"
                >
                  {/* Community / space breadcrumb */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <Link
                      href={`/community/${post.space.community.slug}`}
                      className="hover:text-[#009CD9] transition-colors"
                    >
                      {post.space.community.name}
                    </Link>
                    <span>/</span>
                    <span>{post.space.name}</span>
                  </div>

                  {/* Title */}
                  {post.title && (
                    <p className="text-[#EEE6E4] font-medium text-sm leading-snug mb-1">
                      {post.title}
                    </p>
                  )}

                  {/* Body preview */}
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                    {post.body}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
