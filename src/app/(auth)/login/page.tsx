"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Car, Bot, Video } from "lucide-react";
import { Logo } from "@/components/ui/logo";

function LoginFormContent() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }

      if (data.data?.tokens?.accessToken) {
        localStorage.setItem("detailhub_access_token", data.data.tokens.accessToken);
        localStorage.setItem("detailhub_refresh_token", data.data.tokens.refreshToken);
      }
      if (data.data?.user) {
        localStorage.setItem("detailhub_user_role", data.data.user.role);
        localStorage.setItem("detailhub_user_name", `${data.data.user.firstName} ${data.data.user.lastName}`.trim());
        localStorage.setItem("detailhub_user_email", data.data.user.email);
        if (data.data.user.userId) {
          localStorage.setItem("detailhub_user_id", data.data.user.userId);
        }
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex">
      {/* Left panel - decorative */}
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
                Bem-vindo de volta à sua
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"> comunidade</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Acesse suas comunidades, conteúdos exclusivos e ferramentas premium.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Car, text: "Comunidades automotivas exclusivas" },
                { icon: Bot, text: "IA Mecânica para diagnosticar e criar" },
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

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <Logo size="md" />
          <span className="text-gray-900 font-bold text-lg">DetailHub</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Entrar na sua conta</h2>
            <p className="text-gray-400">Digite suas credenciais para continuar.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-600">Senha</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
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
                  className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
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
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
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
