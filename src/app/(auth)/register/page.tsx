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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "COMMUNITY_MEMBER" }),
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
    <div className="min-h-screen bg-[#F8F7FF] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#F0EEFF]">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-center px-16 py-12">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <Logo size="lg" />
            <span className="text-gray-900 font-bold text-xl">DetailHub</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                Junte-se à maior
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"> comunidade automotiva</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Acesse conteúdos exclusivos, comunidades premium e ferramentas criadas para entusiastas.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Car, text: "Comunidades automotivas exclusivas" },
                { icon: Bot, text: "IA Mecânica para diagnosticar e aprender" },
                { icon: Video, text: "Lives, cursos e marketplace" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-violet-400" />
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
          <span className="text-gray-900 font-bold text-lg">DetailHub</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Criar sua conta</h2>
            <p className="text-gray-400">Preencha seus dados para começar.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Nome</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm ${
                    fieldErrors.firstName ? "border-red-500/50" : "border-gray-200 hover:border-violet-200 focus:border-violet-400"
                  }`}
                  placeholder="João"
                  autoComplete="given-name"
                />
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Sobrenome</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm ${
                    fieldErrors.lastName ? "border-red-500/50" : "border-gray-200 hover:border-violet-200 focus:border-violet-400"
                  }`}
                  placeholder="Silva"
                  autoComplete="family-name"
                />
                {fieldErrors.lastName && <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {(["email", "password", "confirmPassword"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  {field === "email" ? "Email" : field === "password" ? "Senha" : "Confirmar senha"}
                </label>
                <input
                  type={field === "email" ? "email" : "password"}
                  required
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm ${
                    fieldErrors[field] ? "border-red-500/50" : "border-gray-200 hover:border-violet-200 focus:border-violet-400"
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
              className="w-full mt-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
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
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
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
