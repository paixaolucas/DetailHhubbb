"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Car, Bot, Video } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PasswordStrength } from "@/components/ui/password-strength";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Capture referral code from URL param or cookie (set by /convite/[code])
  const refCode = searchParams.get("ref") ?? (
    typeof document !== "undefined"
      ? document.cookie.split("; ").find((c) => c.startsWith("detailhub_ref="))?.split("=")[1]
      : undefined
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const body: Record<string, string> = { ...form };
      if (refCode) body.referralCode = refCode;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const errs: Record<string, string> = {};
          for (const d of data.details) {
            if (d.path?.[0]) errs[d.path[0]] = d.message;
          }
          setFieldErrors(errs);
        } else {
          setError(data.error ?? "Erro ao criar conta");
        }
        return;
      }

      if (data.data?.tokens?.accessToken) {
        localStorage.setItem("detailhub_access_token", data.data.tokens.accessToken);
      }
      if (data.data?.user) {
        localStorage.setItem("detailhub_user_role", data.data.user.role ?? "COMMUNITY_MEMBER");
        localStorage.setItem("detailhub_user_name", `${data.data.user.firstName} ${data.data.user.lastName}`.trim());
        localStorage.setItem("detailhub_user_email", data.data.user.email);
        if (data.data.user.id) {
          localStorage.setItem("detailhub_user_id", data.data.user.id);
        }
      }

      const planId = searchParams.get("plan");
      const community = searchParams.get("community");

      if (planId) {
        try {
          const checkoutRes = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.data?.tokens?.accessToken}`,
            },
            body: JSON.stringify({ planId }),
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutData.data?.url) {
            window.location.href = checkoutData.data.url;
            return;
          }
        } catch {}
        router.push(community ? `/community/${community}` : "/dashboard");
      } else if (community) {
        router.push(`/community/${community}`);
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1A1A1A]">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#006079]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-center px-16 py-12">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <Logo size="lg" />
            <span className="text-[#EEE6E4] font-bold text-xl">Detailer&apos;HUB</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-[#EEE6E4] leading-tight mb-4">
                Junte-se à maior
                <span className="bg-gradient-to-r from-[#009CD9] to-[#007A99] bg-clip-text text-transparent"> comunidade automotiva</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Acesse conteúdos exclusivos, comunidades premium e ferramentas criadas para entusiastas.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Car, text: "Comunidades automotivas exclusivas" },
                { icon: Bot, text: "IA Mecânica para diagnosticar e aprender" },
                { icon: Video, text: "Lives, cursos e marketplace" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-[#006079]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#009CD9]" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <Logo size="md" />
          <span className="text-[#EEE6E4] font-bold text-lg">Detailer&apos;HUB</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#EEE6E4] mb-1">Criar sua conta</h2>
            <p className="text-gray-400">Preencha seus dados para começar.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Register */}
          <a
            href={`/api/auth/google?redirect=${encodeURIComponent(
              searchParams.get("plan")
                ? `/dashboard`
                : searchParams.get("community")
                  ? `/community/${searchParams.get("community")}`
                  : "/dashboard"
            )}${refCode ? `&ref=${encodeURIComponent(refCode)}` : ""}`}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl px-4 py-3.5 text-gray-300 font-medium transition-all active:scale-[0.98] mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Criar conta com Google
          </a>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1A1A1A] px-3 text-gray-400">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm ${
                    fieldErrors.firstName ? "border-red-500/50" : "border-white/10 hover:border-[#007A99] focus:border-[#009CD9]"
                  }`}
                  placeholder="João"
                  autoComplete="given-name"
                />
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sobrenome</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm ${
                    fieldErrors.lastName ? "border-red-500/50" : "border-white/10 hover:border-[#007A99] focus:border-[#009CD9]"
                  }`}
                  placeholder="Silva"
                  autoComplete="family-name"
                />
                {fieldErrors.lastName && <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {(["email", "password", "confirmPassword"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  {field === "email" ? "Email" : field === "password" ? "Senha" : "Confirmar senha"}
                </label>
                <input
                  type={field === "email" ? "email" : "password"}
                  required
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm ${
                    fieldErrors[field] ? "border-red-500/50" : "border-white/10 hover:border-[#007A99] focus:border-[#009CD9]"
                  }`}
                  placeholder={field === "email" ? "seu@email.com" : "••••••••"}
                  autoComplete={field === "email" ? "email" : "new-password"}
                />
                {fieldErrors[field] && <p className="mt-1 text-xs text-red-400">{fieldErrors[field]}</p>}
                {field === "password" && <PasswordStrength password={form.password} />}
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#006079]/30 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta grátis"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#009CD9] hover:text-[#007A99] font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterFormContent />
    </Suspense>
  );
}
