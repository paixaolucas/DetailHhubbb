"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { STORAGE_KEYS } from "@/lib/constants";
import LoginBackground from "@/components/auth/LoginBackground";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") || null
  );
  const verified = searchParams.get("verificado") === "true";

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
        if (data.code === "EMAIL_NOT_VERIFIED") {
          window.location.href = `/verificar-email?email=${encodeURIComponent(form.email)}`;
          return;
        }
        setError(data.error ?? "Credenciais inválidas");
        setIsLoading(false);
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
    <div className="h-screen flex overflow-hidden">

      {/* ── PAINEL ESQUERDO ───────────────────────────────────────────── */}
      {/* Problem 4: border-0 remove qualquer borda residual do reset global */}
      {/* Problem 8: box-shadow inset adiciona vinheta lateral */}
      <div
        className="w-full md:w-[400px] flex-none bg-[#111518] overflow-y-auto border-0 border-r border-white/[0.08]"
        style={{ boxShadow: 'inset -1px 0 60px rgba(0,0,0,0.4)' }}
      >
        {/* Problem 2: items-center centraliza tudo, px-6 mobile / px-10 desktop */}
        <div className="flex flex-col items-center min-h-full px-6 md:px-10 py-12">

          {/* Problem 1: logo grande + nome, centralizado */}
          <Link href="/" className="flex flex-col items-center mb-10">
            <Logo size="lg" />
            <span
              style={{
                fontFamily: 'var(--font-titillium)',
                fontSize: '22px',
                fontWeight: 600,
                color: '#EEE6E4',
                marginTop: '12px',
                letterSpacing: '0.02em',
              }}
            >
              Detailer&apos;HUB
            </span>
          </Link>

          {/* Problem 2: conteúdo do formulário max-w-[320px] */}
          <div className="w-full max-w-[320px]">

            {/* Problem 3: título enxuto, sem subtítulo */}
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#EEE6E4',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Acesse sua conta
            </h1>

            {/* Email verificado */}
            {verified && (
              <div className="mb-5 p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                Email verificado! Faça login para continuar.
              </div>
            )}

            {/* Erro */}
            {error && (
              <div role="alert" className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Google — copy: "Continuar com Google" */}
            <a
              href={`/api/auth/google?redirect=${encodeURIComponent(searchParams.get("redirect") || "/dashboard")}`}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl px-4 py-3 text-[#EEE6E4] text-sm font-medium transition-all active:scale-[0.98] mb-5"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com Google
            </a>

            {/* Divisor */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-400">ou entre com email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Seu email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 hover:border-[#007A99] focus:border-[#009CD9] rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-gray-400 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Sua senha"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 hover:border-[#007A99] focus:border-[#009CD9] rounded-xl px-4 py-3 pr-11 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Esqueceu senha — copy mais humano */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-400 hover:text-[#009CD9] transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#006079]/30 active:scale-[0.98] text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no hub"
                )}
              </button>
            </form>

            {/* Criar conta — copy mais direto */}
            <p className="text-sm text-gray-400 text-center mt-6">
              Ainda não tem acesso?{" "}
              <Link
                href="/register"
                className="text-[#009CD9] hover:text-[#EEE6E4] transition-colors"
              >
                Criar conta
              </Link>
            </p>

          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO — Canvas animado ───────────────────────────── */}
      <div className="hidden md:block flex-1 bg-[#0a1520]">
        <LoginBackground className="w-full h-full" />
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormContent />
    </Suspense>
  );
}
