"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  ExternalLink,
  Settings,
  BarChart2,
  MoreVertical,
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  primaryColor: string;
  memberCount: number;
  isPublished: boolean;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    const role = localStorage.getItem("detailhub_user_role");
    setIsAdmin(role === "SUPER_ADMIN");
    fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => d.success && setCommunities(d.data ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-white rounded w-40 animate-pulse" />
          <div className="h-9 bg-white rounded-xl w-36 animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-white rounded w-1/3" />
                <div className="h-4 bg-white rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunidades</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie suas comunidades automotivas</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/communities/new"
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
          >
            <Plus className="w-4 h-4" />
            Nova comunidade
          </Link>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma comunidade ainda
          </h3>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
            Crie sua primeira comunidade automotiva e comece a monetizar sua audiência hoje.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {communities.map((community) => (
            <div
              key={community.id}
              className="glass-card p-6 hover:border-violet-200 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Logo */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-900 font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: community.primaryColor }}
                  >
                    {community.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 group-hover:text-violet-300 transition-colors">
                        {community.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          community.isPublished
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {community.isPublished ? "Publicada" : "Rascunho"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5 truncate">
                      {community.shortDescription ?? "Sem descrição"}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      detailhub.com/{community.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Member count */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xl font-bold text-gray-900">{community.memberCount}</p>
                    <p className="text-xs text-gray-500">membros</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/community/${community.slug}`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver comunidade"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/analytics?communityId=${community.id}`}
                      className="p-2 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      title="Analytics"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/communities/${community.id}/settings`}
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Configurações"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
