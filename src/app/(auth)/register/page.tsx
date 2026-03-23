"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Car, Bot, Video } from "lucide-react";
import { LogoType } from "@/components/ui/logo";
import { PasswordStrength } from "@/components/ui/password-strength";

function RegisterFormContent() {
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

      // Redirect to email verification — tokens are only issued after verification
      const email = data.data?.user?.email ?? "";
      window.location.href = `/verificar-email?email=${encodeURIComponent(email)}`;
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
          <Link href="/" className="flex items-center mb-16">
            <LogoType height={30} variant="light" />
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-[#EEE6E4] leading-tight mb-4">
                As melhores comunidades de
                <span className="bg-gradient-to-r from-[#009CD9] to-[#007A99] bg-clip-text text-transparent"> estética automotiva do Brasil</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Em um só lugar. Uma assinatura. Acesso a tudo.
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
        <Link href="/" className="flex items-center mb-8 lg:hidden">
          <LogoType height={26} variant="light" />
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
