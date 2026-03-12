"use client";

import Image from "next/image";
import { Users, FileText, User } from "lucide-react";

type ResultType = "community" | "post" | "member";

interface SearchResultItemProps {
  type: ResultType;
  item: any;
  onClick: () => void;
}

function Initials({ name, className }: { name: string; className?: string }) {
  const parts = name.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 font-semibold text-xs uppercase ${className ?? ""}`}
    >
      {letters.toUpperCase()}
    </div>
  );
}

export default function SearchResultItem({ type, item, onClick }: SearchResultItemProps) {
  const baseClass =
    "flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors w-full text-left";

  if (type === "community") {
    return (
      <button className={baseClass} onClick={onClick}>
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
          {item.logoUrl ? (
            <Image src={item.logoUrl} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
          ) : (
            <Initials name={item.name} className="w-full h-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          {item.shortDescription && (
            <p className="text-xs text-gray-400 truncate">{item.shortDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          <Users className="w-3 h-3" />
          <span>{item.memberCount ?? 0}</span>
        </div>
        <span className="text-xs text-gray-600 flex-shrink-0">comunidade</span>
      </button>
    );
  }

  if (type === "post") {
    const authorName = item.author
      ? `${item.author.firstName} ${item.author.lastName}`.trim()
      : "Autor desconhecido";
    const communitySlug = item.space?.community?.slug ?? "";
    const spaceName = item.space?.name ?? "";
    const bodyExcerpt = (item.body ?? "").slice(0, 80);

    return (
      <button className={baseClass} onClick={onClick}>
        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {authorName}
            {spaceName && ` · ${spaceName}`}
            {communitySlug && ` · ${communitySlug}`}
          </p>
          {bodyExcerpt && (
            <p className="text-xs text-gray-500 truncate">{bodyExcerpt}</p>
          )}
        </div>
      </button>
    );
  }

  if (type === "member") {
    const fullName = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim();
    const roleLabel: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      INFLUENCER_ADMIN: "Criador",
      COMMUNITY_MEMBER: "Membro",
      MARKETPLACE_PARTNER: "Parceiro",
    };

    return (
      <button className={baseClass} onClick={onClick}>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          {item.avatarUrl ? (
            <Image src={item.avatarUrl} alt={fullName} width={36} height={36} className="w-full h-full object-cover" />
          ) : (
            <Initials name={fullName || "?"} className="w-full h-full rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{fullName || "Usuário"}</p>
          <p className="text-xs text-gray-400">{roleLabel[item.role] ?? item.role}</p>
        </div>
        <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </button>
    );
  }

  return null;
}
