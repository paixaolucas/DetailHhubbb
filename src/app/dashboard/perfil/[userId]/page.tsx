"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Instagram,
  Twitter,
  Globe,
  Linkedin,
  Facebook,
  ExternalLink,
  Settings,
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

interface ProfileData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    createdAt: string;
    lastLoginAt: string | null;
  };
  headline: string | null;
  bio: string | null;
  location: string | null;
  socialLinks: Record<string, string>;
  isPublic: boolean;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "há algum tempo";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "agora mesmo";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 30) return `há ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;
  return "há mais de um mês";
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwn, setIsOwn] = useState(false);

  useEffect(() => {
    const myId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    setIsOwn(myId === userId);

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch(`/api/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data as ProfileData);
        } else {
          setError("Perfil não encontrado.");
        }
      })
      .catch(() => setError("Erro de conexão."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-400 mb-4">{error || "Perfil não encontrado."}</p>
        <button onClick={() => router.back()} className="text-[#009CD9] text-sm hover:underline">
          ← Voltar
        </button>
      </div>
    );
  }

  const { user, headline, bio, location, socialLinks } = profile;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  const socialIcons: { key: string; label: string; icon: React.ElementType; color: string }[] = [
    { key: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
    { key: "twitter", label: "Twitter", icon: Twitter, color: "text-sky-400" },
    { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-400" },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
    { key: "website", label: "Website", icon: Globe, color: "text-[#009CD9]" },
  ];

  const activeSocial = socialIcons.filter((s) => socialLinks[s.key]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-[#EEE6E4]">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Hero card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Banner gradient */}
        <div className="h-24 bg-gradient-to-r from-[#006079] to-[#009CD9] relative" />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-[#1A1A1A] overflow-hidden bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={fullName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {isOwn ? (
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-[#EEE6E4] hover:bg-white/10 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                Editar perfil
              </Link>
            ) : (
              <Link
                href="/dashboard/messages"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006079] hover:bg-[#007A99] rounded-xl text-xs text-white font-medium transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Mensagem
              </Link>
            )}
          </div>

          <h1 className="text-xl font-bold text-[#EEE6E4]">{fullName}</h1>
          {headline && <p className="text-sm text-[#009CD9] mt-0.5">{headline}</p>}

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            {user.lastLoginAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Visto {formatRelativeTime(user.lastLoginAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Membro desde {formatMemberSince(user.createdAt)}
            </span>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#EEE6E4] mb-3">Sobre</h2>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{bio}</p>
        </div>
      )}

      {/* Social links */}
      {activeSocial.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#EEE6E4] mb-3">Links</h2>
          <div className="space-y-2">
            {activeSocial.map(({ key, label: _label, icon: Icon, color }) => (
              <a
                key={key}
                href={socialLinks[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors group"
              >
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <span className="truncate group-hover:underline">{socialLinks[key]}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when profile is empty and owner is viewing */}
      {!bio && !headline && !location && activeSocial.length === 0 && isOwn && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm mb-3">Seu perfil está vazio. Complete suas informações!</p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#006079] hover:bg-[#007A99] text-white text-sm font-medium rounded-xl transition-all"
          >
            <Settings className="w-4 h-4" />
            Completar perfil
          </Link>
        </div>
      )}
    </div>
  );
}
