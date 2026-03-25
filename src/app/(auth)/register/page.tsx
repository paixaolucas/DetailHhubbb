"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PasswordStrength } from "@/components/ui/password-strength";
import LoginBackground from "@/components/auth/LoginBackground";

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Captura referral code da URL ou cookie
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

      const email = data.data?.user?.email ?? "";
      window.location.href = `/verificar-email?email=${encodeURIComponent(email)}`;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm ${
      fieldErrors[field]
        ? "border-red-500/50"
        : "border-white/10 hover:border-[#007A99] focus:border-[#009CD9]"
    }`;

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── PAINEL ESQUERDO ── */}
      <div
        className="w-full md:w-[420px] flex-none bg-[#111518] overflow-y-auto border-0 border-r border-white/[0.08]"
        style={{ boxShadow: "inset -1px 0 60px rgba(0,0,0,0.4)" }}
      >
        <div className="flex flex-col items-center min-h-full px-6 md:px-10 py-12">

          {/* Logo */}
          <Link href="/" className="flex flex-col items-center mb-8">
            <Logo size="lg" />
            <span
              style={{
                fontFamily: "var(--font-titillium)",
                fontSize: "22px",
                fontWeight: 600,
                color: "#EEE6E4",
                marginTop: "12px",
                letterSpacing: "0.02em",
              }}
            >
              Detailer&apos;HUB
            </span>
          </Link>

          <div className="w-full max-w-[320px]">

            <h1
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#EEE6E4",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              Criar sua conta
            </h1>

            {/* Erro geral */}
            {error && (
              <div role="alert" className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Google */}
            <a
              href={`/api/auth/google?redirect=${encodeURIComponent("/inicio")}`}
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
              <span className="text-xs text-gray-400">ou cadastre com email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nome + Sobrenome */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="João"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    autoComplete="given-name"
                    className={inputClass("firstName")}
                  />
                  {fieldErrors.firstName && <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Sobrenome</label>
                  <input
                    type="text"
                    required
                    placeholder="Silva"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    autoComplete="family-name"
                    className={inputClass("lastName")}
                  />
                  {fieldErrors.lastName && <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  className={inputClass("email")}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                    className={inputClass("password") + " pr-11"}
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
                {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
                <PasswordStrength password={form.password} />
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                    className={inputClass("confirmPassword") + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#006079]/30 active:scale-[0.98] text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            <p className="text-sm text-gray-400 text-center mt-6">
              Já tem acesso?{" "}
              <Link href="/login" className="text-[#009CD9] hover:text-[#EEE6E4] transition-colors">
                Entrar
              </Link>
            </p>

          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO — Canvas animado ── */}
      <div className="hidden md:block flex-1 bg-[#0a1520]">
        <LoginBackground className="w-full h-full" />
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFormContent />
    </Suspense>
  );
}
