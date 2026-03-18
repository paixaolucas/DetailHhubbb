"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, ExternalLink, Calendar } from "lucide-react";

interface CertificateCommunity {
  name: string;
  logoUrl: string | null;
  slug: string;
}

interface CertificateCardProps {
  certificate: {
    id: string;
    title: string;
    code: string;
    completedAt: string | Date;
    community: CertificateCommunity;
  };
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const { community } = certificate;
  const initials = community.name.charAt(0).toUpperCase();

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#99D3DF] transition-all group flex flex-col gap-4">
      {/* Community identity */}
      <div className="flex items-center gap-3">
        {community.logoUrl ? (
          <Image
            src={community.logoUrl}
            alt={community.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#006079]/30 flex items-center justify-center text-[#33A7BF] font-bold text-sm flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{community.name}</p>
          <p className="text-sm font-semibold text-[#EEE6E4] truncate group-hover:text-[#33A7BF] transition-colors">
            {certificate.title}
          </p>
        </div>
      </div>

      {/* Award icon + divider */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <Award className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Date + code */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span>{formatDate(certificate.completedAt)}</span>
        </div>
        <p className="text-[11px] text-gray-400 font-mono tracking-wide">
          #{certificate.code}
        </p>
      </div>

      {/* Action */}
      <Link
        href={`/certificates/${certificate.code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#E6F4F7] hover:bg-[#006079] border border-[#99D3DF] hover:border-[#006079] text-[#006079] hover:text-white text-sm font-medium py-2 rounded-xl transition-all"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Ver Certificado
      </Link>
    </div>
  );
}
