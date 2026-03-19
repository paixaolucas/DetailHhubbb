// =============================================================================
// CERTIFICATE VERIFICATION PAGE — Server Component, no auth
// /certificates/[code]
// =============================================================================

import Image from "next/image";
import { LogoType } from "@/components/ui/logo";
import { CheckCircle2, XCircle, Award, Calendar, Shield } from "lucide-react";
import Link from "next/link";
import { CertificateShareButtons } from "@/components/ui/certificate-share-buttons";

interface CertificateData {
  id: string;
  title: string;
  code: string;
  completedAt: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  community: {
    name: string;
    logoUrl: string | null;
    slug: string;
  };
}

async function getCertificate(code: string): Promise<CertificateData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/certificates/verify/${code}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CertificatePage({
  params,
}: {
  params: { code: string };
}) {
  const certificate = await getCertificate(params.code);
  const isValid = certificate !== null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center px-4 py-12">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute inset-0 ${
            isValid
              ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.12)_0%,transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_50%_0%,rgba(239,68,68,0.08)_0%,transparent_70%)]"
          }`}
        />
      </div>

      {/* Back link */}
      <div className="w-full max-w-2xl mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-400 transition-colors w-fit"
        >
          <span>←</span> Detailer'HUB
        </Link>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Top accent bar */}
        <div
          className={`h-1.5 w-full ${
            isValid
              ? "bg-gradient-to-r from-[#006079] via-[#009CD9] to-[#007A99]"
              : "bg-gradient-to-r from-red-600 to-red-400"
          }`}
        />

        <div className="p-8 md:p-12 space-y-8">
          {/* Platform header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoType height={24} variant="light" />
              <p className="text-gray-500 text-xs">Plataforma de Comunidades</p>
            </div>

            {/* Valid / invalid badge */}
            {isValid ? (
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Certificado válido
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                <XCircle className="w-3.5 h-3.5" />
                Inválido
              </div>
            )}
          </div>

          {isValid && certificate ? (
            <>
              {/* Certificate body */}
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">
                  Certificado de Conclusão
                </p>
                <div className="w-20 h-20 bg-yellow-500/15 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-10 h-10 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Certificamos que</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#EEE6E4]">
                    {certificate.user.firstName} {certificate.user.lastName}
                  </h1>
                </div>
                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                  concluiu com sucesso o curso/programa
                </p>
                <h2 className="text-xl font-semibold text-[#33A7BF] px-4">
                  &ldquo;{certificate.title}&rdquo;
                </h2>
              </div>

              {/* Community info */}
              <div className="flex items-center justify-center gap-3 py-3 border-t border-b border-white/10">
                {certificate.community.logoUrl ? (
                  <Image
                    src={certificate.community.logoUrl}
                    alt={certificate.community.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#006079]/30 flex items-center justify-center text-[#33A7BF] font-bold text-sm">
                    {certificate.community.name.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs text-gray-500">Oferecido por</p>
                  <p className="text-sm font-semibold text-[#EEE6E4]">
                    {certificate.community.name}
                  </p>
                </div>
              </div>

              {/* Date + code */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Concluído em {formatDate(certificate.completedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="font-mono text-gray-500 text-xs tracking-wider">
                    #{certificate.code}
                  </span>
                </div>
              </div>

              {/* Share buttons */}
              <CertificateShareButtons />
            </>
          ) : (
            /* Invalid state */
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#EEE6E4] mb-2">
                  Este certificado é inválido
                </h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  O código{" "}
                  <span className="font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded text-xs">
                    {params.code}
                  </span>{" "}
                  não corresponde a nenhum certificado emitido pela plataforma.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Ir para o início
              </Link>
            </div>
          )}
        </div>

        {/* Bottom watermark */}
        <div className="px-8 md:px-12 py-4 bg-white/[0.02] border-t border-white/10 text-center">
          <p className="text-xs text-gray-400">
            Verifique a autenticidade em{" "}
            <span className="text-gray-500 font-mono">
              {(process.env.NEXT_PUBLIC_APP_URL ?? "detailhub.com").replace(/\/$/, "")}/certificates/{params.code}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
