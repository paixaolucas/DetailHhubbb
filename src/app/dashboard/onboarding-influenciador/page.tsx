"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Circle,
  Copy,
  ExternalLink,
  FileVideo,
  Link2,
  PartyPopper,
  Settings,
  Users,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ChecklistKey =
  | "community"
  | "video"
  | "inviteLink"
  | "linkPinned"
  | "liveScheduled"
  | "moduleConfirmed";

const CHECKLIST_ITEMS: { key: ChecklistKey; label: string }[] = [
  { key: "community",      label: "Comunidade criada com logo e descrição" },
  { key: "video",          label: "Pelo menos 1 vídeo publicado" },
  { key: "inviteLink",     label: "Link de convite configurado" },
  { key: "linkPinned",     label: "Link fixado no Instagram/TikTok" },
  { key: "liveScheduled",  label: "Live de lançamento agendada" },
  { key: "moduleConfirmed",label: "Módulo de responsabilidade confirmado" },
];

const TOTAL_STEPS = 5;

// ── Progress bar ──────────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">
          Passo <span className="font-semibold text-[#EEE6E4]">{current}</span> de{" "}
          <span className="font-semibold text-[#EEE6E4]">{TOTAL_STEPS}</span>
        </p>
        <p className="text-xs text-gray-500">{Math.round((current / TOTAL_STEPS) * 100)}% concluído</p>
      </div>

      {/* Track */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-500"
          style={{ width: `${(current / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step <= current
                ? "bg-[#009CD9] scale-125"
                : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-fade-in text-center">
      <div className="w-20 h-20 bg-[#006079]/20 border border-[#009CD9]/30 rounded-2xl flex items-center justify-center mx-auto mb-8">
        <PartyPopper className="w-10 h-10 text-[#009CD9]" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-[#EEE6E4] mb-4">
        Bem-vindo à plataforma, parceiro!
      </h1>
      <p className="text-gray-400 leading-relaxed max-w-md mx-auto mb-8">
        Você acabou de entrar no modelo que separa os criadores que dependem de algoritmo dos que
        têm renda previsível.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-10 text-left">
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-[#009CD9] mb-1">35%</p>
          <p className="text-sm text-gray-400">Comissão direta sobre cada membro que você trouxer</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-[#009CD9] mb-1">+15%</p>
          <p className="text-sm text-gray-400">Caixa de performance — bônus mensal coletivo</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#006079]/30 active:scale-95"
      >
        Começar <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#006079]/20 border border-[#007A99]/30 rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5 text-[#009CD9]" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#EEE6E4]">Criar sua comunidade</h2>
      </div>

      <p className="text-gray-400 leading-relaxed mb-6">
        Sua comunidade é o espaço onde seus membros vão se reunir, acessar conteúdo e interagir
        com você. É o ponto central da sua presença na plataforma.
      </p>

      <div className="glass-card p-5 mb-6 flex gap-3">
        <div className="w-1 bg-[#009CD9]/40 rounded-full flex-shrink-0" />
        <p className="text-sm text-gray-400 leading-relaxed">
          Você pode personalizar logo, banner e cor depois nas configurações. Por enquanto, o mais
          importante é criar e dar um nome claro para sua comunidade.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/communities/new"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#006079]/30 active:scale-95"
        >
          <ExternalLink className="w-4 h-4" />
          Criar comunidade agora
        </Link>
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-[#EEE6E4] px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/5"
        >
          Já tenho ou farei depois
        </button>
      </div>
    </div>
  );
}

function Step3({ onNext }: { onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  const mockLink = "detailerhub.com/convite/seu-codigo";

  function copyLink() {
    navigator.clipboard.writeText(mockLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#006079]/20 border border-[#007A99]/30 rounded-xl flex items-center justify-center">
          <Link2 className="w-5 h-5 text-[#009CD9]" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#EEE6E4]">Seu link de convite</h2>
      </div>

      <p className="text-gray-400 leading-relaxed mb-8">
        Seu link de convite é seu ativo mais importante. Cada membro que entrar pelo seu link fica
        vinculado a você{" "}
        <span className="text-[#EEE6E4] font-medium">para sempre</span> — independente do que
        aconteça depois. É a base da sua receita recorrente.
      </p>

      {/* Link card */}
      <div className="bg-gradient-to-r from-[#006079]/20 to-[#009CD9]/10 border border-[#009CD9]/30 rounded-2xl p-6 mb-8">
        <p className="text-xs text-[#009CD9] font-semibold uppercase tracking-wider mb-3">
          Seu link de convite
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-[#EEE6E4] font-mono text-sm bg-black/20 rounded-xl px-4 py-3 truncate">
            {mockLink}
          </code>
          <button
            onClick={copyLink}
            aria-label="Copiar link"
            className="flex-shrink-0 w-10 h-10 bg-[#006079]/30 hover:bg-[#007A99]/40 border border-[#007A99]/30 rounded-xl flex items-center justify-center text-[#009CD9] transition-all"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center gap-2 border border-[#009CD9]/30 hover:border-[#009CD9]/60 text-[#009CD9] px-6 py-3 rounded-xl font-semibold transition-all hover:bg-[#009CD9]/10"
        >
          <Settings className="w-4 h-4" />
          Ver meu link nas configurações
        </Link>
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#006079]/30 active:scale-95"
        >
          Continuar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Step4({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#006079]/20 border border-[#007A99]/30 rounded-xl flex items-center justify-center">
          <FileVideo className="w-5 h-5 text-[#009CD9]" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#EEE6E4]">Guia de gravação</h2>
      </div>

      <p className="text-gray-400 leading-relaxed mb-6">
        Antes de gravar seu primeiro módulo, leia o guia de gravação — áudio, vídeo, estrutura e
        checklist. Conteúdo bem gravado é a diferença entre um membro que fica e um que cancela.
      </p>

      <div className="glass-card p-5 mb-8">
        <h3 className="text-sm font-semibold text-[#EEE6E4] mb-3">O que você vai encontrar no guia:</h3>
        <ul className="space-y-2">
          {[
            "Configuração mínima de áudio e vídeo",
            "Estrutura de módulo recomendada",
            "Duração ideal por aula",
            "Checklist antes de enviar",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/content"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#006079]/30 active:scale-95"
        >
          <ExternalLink className="w-4 h-4" />
          Ver guia de gravação
        </Link>
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-[#EEE6E4] px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/5"
        >
          Continuar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Step5() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<ChecklistKey, boolean>>({
    community:       false,
    video:           false,
    inviteLink:      false,
    linkPinned:      false,
    liveScheduled:   false,
    moduleConfirmed: false,
  });

  const completedCount = Object.values(checked).filter(Boolean).length;
  const allDone = completedCount === CHECKLIST_ITEMS.length;

  function toggle(key: ChecklistKey) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#006079]/20 border border-[#007A99]/30 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-[#009CD9]" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#EEE6E4]">Checklist de lançamento</h2>
      </div>

      <p className="text-gray-400 leading-relaxed mb-8">
        Antes de divulgar sua comunidade, confirme que você passou pelos itens essenciais.
        Você não precisa completar tudo agora — mas quanto mais itens, mais forte é o seu lançamento.
      </p>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 flex-shrink-0">
          {completedCount}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-3 mb-10">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => toggle(item.key)}
              aria-pressed={checked[item.key]}
              className="w-full flex items-center gap-3 glass-card p-4 hover:border-white/20 transition-all text-left group"
            >
              {checked[item.key] ? (
                <CheckCircle className="w-5 h-5 text-[#009CD9] flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
              )}
              <span
                className={`text-sm transition-colors ${
                  checked[item.key] ? "text-gray-400 line-through" : "text-[#EEE6E4]"
                }`}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => router.push("/dashboard")}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
          allDone
            ? "bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white hover:shadow-lg hover:shadow-[#006079]/30 active:scale-95"
            : "bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white hover:shadow-lg hover:shadow-[#006079]/30 active:scale-95"
        }`}
      >
        {allDone ? (
          <>
            <PartyPopper className="w-4 h-4" />
            Ir para o dashboard — tudo pronto!
          </>
        ) : (
          <>
            Ir para o dashboard
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingInfluenciadorPage() {
  const [step, setStep] = useState(1);

  function nextStep() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#006079]/15 rounded-full blur-[120px]" />

      <div className="w-full max-w-xl relative">
        {/* Card */}
        <div className="glass-card p-6 md:p-10">
          <StepProgress current={step} />

          {step === 1 && <Step1 onNext={nextStep} />}
          {step === 2 && <Step2 onNext={nextStep} />}
          {step === 3 && <Step3 onNext={nextStep} />}
          {step === 4 && <Step4 onNext={nextStep} />}
          {step === 5 && <Step5 />}
        </div>

        {/* Skip link */}
        {step < TOTAL_STEPS && (
          <div className="text-center mt-4">
            <Link
              href="/dashboard"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Pular onboarding e ir para o dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
