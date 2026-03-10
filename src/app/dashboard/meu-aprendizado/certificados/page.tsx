"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Award } from "lucide-react";
import { CertificateCard } from "@/components/certificates/CertificateCard";

interface Certificate {
  id: string;
  title: string;
  code: string;
  completedAt: string;
  createdAt: string;
  community: {
    name: string;
    logoUrl: string | null;
    slug: string;
  };
}

function CertificateCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/10 rounded w-24" />
          <div className="h-4 bg-white/10 rounded w-40" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/10" />
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-white/10 rounded w-32" />
        <div className="h-3 bg-white/10 rounded w-20" />
      </div>
      <div className="h-9 bg-white/10 rounded-xl" />
    </div>
  );
}

export default function CertificadosPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    // Decode JWT to get userId (payload is base64url, second segment)
    let userId = "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub ?? payload.userId ?? "";
    } catch {
      setError("Token inválido.");
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setError("Usuário não identificado.");
      setIsLoading(false);
      return;
    }

    fetch(`/api/users/${userId}/certificates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCertificates(d.data ?? []);
        } else {
          setError(d.error ?? "Erro ao carregar certificados.");
        }
      })
      .catch(() => setError("Erro de conexão."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Certificados</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Certificados conquistados nas comunidades
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CertificateCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && certificates.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum certificado conquistado ainda
          </h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Complete cursos e programas nas comunidades para receber seus
            certificados aqui.
          </p>
        </div>
      )}

      {/* Certificates grid */}
      {!isLoading && certificates.length > 0 && (
        <>
          <p className="text-sm text-gray-500">
            {certificates.length} certificado{certificates.length !== 1 ? "s" : ""} conquistado
            {certificates.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
