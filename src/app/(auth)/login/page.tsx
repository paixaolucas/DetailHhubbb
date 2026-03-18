"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Car, Bot, Video } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { STORAGE_KEYS } from "@/lib/constants";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") || null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Credenciais inválidas");
        setIsLoading(false);
        // Scroll to Google button if it's a Google-only account
        if (data.code === "GOOGLE_ONLY_ACCOUNT") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      if (data.data?.tokens?.accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.tokens.accessToken);
      }
      if (data.data?.user) {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, data.data.user.role);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, `${data.data.user.firstName} ${data.data.user.lastName}`.trim());
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.data.user.email);
        if (data.data.user.userId) {
          localStorage.setItem(STORAGE_KEYS.USER_ID, data.data.user.userId);
        }
      }

      // Hard navigation garante que o cookie httpOnly seja enviado corretamente
      const redirect = searchParams.get("redirect");
      window.location.href = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      {/* Left panel - decorative */}
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
                Bem-vindo de volta à sua
                <span className="bg-gradient-to-r from-[#009CD9] to-[#007A99] bg-clip-text text-transparent"> comunidade</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Acesse suas comunidades, conteúdos exclusivos e ferramentas premium.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Car, text: "Comunidades automotivas exclusivas" },
                { icon: Bot, text: "IA Mecânica para diagnosticar e criar" },
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

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <Logo size="md" />
          <span className="text-[#EEE6E4] font-bold text-lg">Detailer&apos;HUB</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#EEE6E4] mb-1">Entrar na sua conta</h2>
            <p className="text-gray-400">Digite suas credenciais para continuar.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Login */}
          <a
            href={`/api/auth/google?redirect=${encodeURIComponent(searchParams.get("redirect") || "/dashboard")}`}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl px-4 py-3.5 text-gray-300 font-medium transition-all active:scale-[0.98] mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </a>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1A1A1A] px-3 text-gray-400">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-[#007A99] focus:border-[#009CD9] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-400">Senha</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#009CD9] hover:text-[#007A99] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 hover:border-[#007A99] focus:border-[#009CD9] rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#006079]/30 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Não tem conta?{" "}
            <Link href="/register" className="text-[#009CD9] hover:text-[#007A99] font-medium transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFormContent />
    </Suspense>
  );
}
