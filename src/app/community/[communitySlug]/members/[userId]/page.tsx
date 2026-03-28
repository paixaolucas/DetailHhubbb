"use client";

// =============================================================================
// Member Profile Page — /community/[communitySlug]/members/[userId]
// Reads GET /api/users/[id]/profile and GET /api/users/[id]/posts
// Allows the profile owner to edit inline (no modal)
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Instagram,
  Globe,
  FileText,
  Calendar,
  Edit2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileUser {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  createdAt: string;
  role: string;
}

interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  location?: string | null;
  interests?: string[];
  socialLinks?: Record<string, string> | null;
  isPublic: boolean;
  user: ProfileUser;
}

interface PostSpace {
  name: string;
  slug: string;
  community: {
    name: string;
    slug: string;
  };
}

interface UserPost {
  id: string;
  title?: string | null;
  body?: string | null;
  createdAt: string;
  space?: PostSpace | null;
}

type ActiveTab = "sobre" | "publicacoes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dia${days !== 1 ? "s" : ""} atrás`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

// Strip the private __garage key from socialLinks before rendering
function getPublicSocialLinks(
  socialLinks: Record<string, string> | null | undefined
): Array<{ key: string; value: string }> {
  if (!socialLinks) return [];
  return Object.entries(socialLinks)
    .filter(([key]) => key !== "__garage" && key !== "garage")
    .map(([key, value]) => ({ key, value }));
}

function socialIcon(key: string) {
  if (key === "instagram") return <Instagram className="w-4 h-4" />;
  return <Globe className="w-4 h-4" />;
}

function socialLabel(key: string): string {
  const map: Record<string, string> = {
    instagram: "Instagram",
    youtube: "YouTube",
    twitter: "Twitter",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    website: "Website",
  };
  return map[key] ?? key;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-36 mb-6" />
      <div className="h-32 bg-white/10 rounded-xl mb-4" />
      <div className="flex flex-col items-center -mt-10 relative z-10 mb-4">
        <div className="w-20 h-20 rounded-full bg-white/10 border-4 border-[#1A1A1A]" />
      </div>
      <div className="h-6 bg-white/10 rounded w-48 mx-auto mb-2" />
      <div className="h-4 bg-white/10 rounded w-64 mx-auto mb-6" />
      <div className="flex gap-4 justify-center mb-6">
        <div className="h-12 bg-white/10 rounded-xl w-28" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
        <div className="h-4 bg-white/10 rounded w-4/6" />
      </div>
    </div>
  );
}

// ─── Edit Form (inline) ───────────────────────────────────────────────────────

interface EditFormProps {
  profile: UserProfile;
  userId: string;
  onSave: (updated: UserProfile) => void;
  onCancel: () => void;
}

function EditForm({ profile, userId, onSave, onCancel }: EditFormProps) {
  const publicLinks = getPublicSocialLinks(profile.socialLinks);
  const instagramLink = publicLinks.find((l) => l.key === "instagram");

  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [instagram, setInstagram] = useState(instagramLink?.value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const socialLinks: Record<string, string> = {};
      if (instagram.trim()) socialLinks.instagram = instagram.trim();

      const res = await fetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({ bio: bio.trim(), location: location.trim(), socialLinks }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Erro ao salvar.");
        return;
      }
      // Merge updated fields back into the original profile shape
      onSave({
        ...profile,
        bio: bio.trim() || null,
        location: location.trim() || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      });
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "bg-white/5 border border-white/10 text-[#EEE6E4] placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-[#009CD9] transition-colors";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-4 space-y-4">
      <p className="text-sm font-semibold text-[#EEE6E4]">Editar perfil</p>

      <div>
        <label className="text-xs text-gray-400 mb-1.5 block font-medium">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Conte um pouco sobre você..."
          className={`${inputClass} resize-none`}
        />
        <p className="text-[10px] text-gray-500 text-right mt-1">{bio.length}/500</p>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1.5 block font-medium">Localização</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
          placeholder="Ex: São Paulo, SP"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1.5 block font-medium">Instagram (URL)</label>
        <input
          type="url"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="https://instagram.com/seuperfil"
          className={inputClass}
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-xl text-sm text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const params = useParams();
  const communitySlug = params.communitySlug as string;
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("sobre");
  const [isEditing, setIsEditing] = useState(false);

  // Detect if the viewer is the profile owner (runs client-side only)
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    const currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    setIsOwner(currentUserId === userId);
  }, [userId]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      const json = await res.json();
      if (!json.success) {
        setError("Perfil não encontrado.");
        return;
      }
      // json.data may be null when profile hasn't been created yet
      setProfile(json.data ?? null);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (activeTab !== "publicacoes") return;
    setPostsLoading(true);
    fetch(`/api/users/${userId}/posts`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPosts(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [activeTab, userId]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />;

  // ── Connection error ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <Link
          href={`/community/${communitySlug}/members`}
          className="text-[#009CD9] text-sm hover:underline"
        >
          Voltar para membros
        </Link>
      </div>
    );
  }

  // ── Profile not configured yet (data: null from API) ──────────────────────
  if (profile === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/community/${communitySlug}/members`}
          className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-[#EEE6E4] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para membros
        </Link>
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <p className="text-[#EEE6E4] font-semibold mb-2">Perfil não configurado ainda</p>
          <p className="text-gray-400 text-sm">
            {isOwner
              ? "Você ainda não preencheu seu perfil."
              : "Este membro ainda não configurou seu perfil."}
          </p>
          {isOwner && (
            <Link
              href="/dashboard/settings"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-xl text-sm text-white font-medium hover:opacity-90 transition-all"
            >
              Configurar perfil
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Profile found ──────────────────────────────────────────────────────────
  // At this point loading is false, error is empty, and profile is not null.
  // The explicit guard below satisfies TypeScript's narrowing.
  if (!profile) return null;

  const { user } = profile;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = getInitials(user.firstName, user.lastName);
  const publicLinks = getPublicSocialLinks(profile.socialLinks);

  return (
    <div className="text-[#EEE6E4] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/community/${communitySlug}/members`}
          className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-[#EEE6E4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para membros
        </Link>

        {/* Banner */}
        <div className="h-32 rounded-xl bg-gradient-to-br from-[#0D1F26] via-[#006079]/60 to-[#1A1A1A] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#009CD9,_transparent)]" />
        </div>

        {/* Avatar — overlaps banner */}
        <div className="flex flex-col items-center -mt-10 relative z-10 mb-2">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={fullName}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-4 border-[#1A1A1A]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] border-4 border-[#1A1A1A] flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#EEE6E4] mb-1">{fullName}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 flex-wrap">
            <span>Visto {timeAgo(user.createdAt)}</span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Membro desde {formatMemberSince(user.createdAt)}
            </span>
          </div>

          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:border-[#006079]/40 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar perfil
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex gap-3 justify-center mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center flex-1 max-w-[130px]">
            <p className="text-lg font-bold text-[#EEE6E4]">{posts.length > 0 ? posts.length : "—"}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-center">
              <FileText className="w-3 h-3" />
              Posts
            </p>
          </div>
        </div>

        {/* Inline edit form */}
        {isEditing && profile && (
          <EditForm
            profile={profile}
            userId={userId}
            onSave={(updated) => {
              setProfile(updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}

        {/* Tabs */}
        <div className="border-b border-white/10 mb-6 mt-2">
          <div className="flex gap-0">
            {(["sobre", "publicacoes"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "text-[#EEE6E4] border-[#009CD9]"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab === "sobre" ? "Sobre" : "Publicações"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Sobre */}
        {activeTab === "sobre" && (
          <div className="space-y-4 animate-fade-in">
            {profile.bio ? (
              <p className="text-[#EEE6E4] text-sm leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-gray-500 text-sm italic">
                {isOwner ? "Você ainda não adicionou uma bio." : "Nenhuma bio adicionada."}
              </p>
            )}

            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                <span>{profile.location}</span>
              </div>
            )}

            {publicLinks.length > 0 && (
              <div className="space-y-2">
                {publicLinks.map(({ key, value }) => (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#009CD9] hover:text-[#33A7BF] transition-colors"
                  >
                    {socialIcon(key)}
                    <span>{socialLabel(key)}</span>
                  </a>
                ))}
              </div>
            )}

            {/* CTA when profile is empty and viewer is owner */}
            {!profile.bio && !profile.location && publicLinks.length === 0 && isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[#009CD9] text-sm hover:underline"
              >
                Preencher perfil agora
              </button>
            )}
          </div>
        )}

        {/* Tab: Publicações */}
        {activeTab === "publicacoes" && (
          <div className="space-y-3 animate-fade-in">
            {postsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse"
                >
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-full mb-1" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhuma publicação ainda.</p>
              </div>
            ) : (
              posts.map((post) => {
                const communityLink = post.space
                  ? `/community/${post.space.community.slug}/feed`
                  : null;

                return (
                  <div
                    key={post.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    {post.title && (
                      <p className="text-[#EEE6E4] font-medium text-sm mb-1 line-clamp-1">
                        {post.title}
                      </p>
                    )}
                    {post.body && (
                      <p className="text-gray-400 text-xs line-clamp-2 mb-2">{post.body}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      {communityLink && (
                        <Link
                          href={communityLink}
                          className="text-[10px] text-[#009CD9] hover:underline"
                        >
                          {post.space?.community.name}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
