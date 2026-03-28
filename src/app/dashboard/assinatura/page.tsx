"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, ShieldOff, CheckCircle, AlertTriangle, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface MembershipData {
  id: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  asaasSubscriptionId: string | null;
  plan: { name: string; price: number; interval: string } | null;
}

const statusMap: Record<
  MembershipData["status"],
  { label: string; className: string }
> = {
  ACTIVE: { label: "Ativo", className: "bg-green-500/10 text-green-400 border border-green-500/20" },
  TRIALING: { label: "Trial", className: "bg-[#009CD9]/10 text-[#009CD9] border border-[#009CD9]/20" },
  PAST_DUE: { label: "Em atraso", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  CANCELED: { label: "Cancelado", className: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number, interval: string): string {
  const brl = (price / 100).toFixed(2).replace(".", ",");
  return interval === "year" ? `R$${brl}/ano` : `R$${brl}/mês`;
}

export default function AssinaturaPage() {
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch("/api/asaas/subscription/me", {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMembership(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    setCanceling(true);
    try {
      const res = await fetch("/api/asaas/subscription/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Assinatura cancelada.");
        setShowCancelModal(false);
        setMembership((prev) => (prev ? { ...prev, status: "CANCELED" } : null));
      } else {
        toast.error(data.error ?? "Erro ao cancelar");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-4">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
        <div className="glass-card p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-32" />
          <div className="h-8 bg-white/10 rounded w-40" />
          <div className="h-4 bg-white/10 rounded w-64" />
          <div className="h-4 bg-white/10 rounded w-48" />
          <div className="h-10 bg-white/10 rounded-xl w-40 mt-2" />
        </div>
        <div className="glass-card p-6 space-y-3 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-40" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-[#EEE6E4] mb-6">Minha Assinatura</h1>
        <div className="glass-card p-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ShieldOff className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-[#EEE6E4] font-semibold">Você não possui assinatura ativa</p>
          <p className="text-sm text-gray-400">
            Assine o Detailer&apos;HUB para acessar todas as comunidades e conteúdos.
          </p>
          <Link
            href="/dashboard/assinar"
            className="mt-2 inline-flex items-center gap-2 btn-premium px-6 py-2.5 text-sm"
          >
            <CreditCard className="w-4 h-4" />
            Ver planos
          </Link>
        </div>
      </div>
    );
  }

  const status = statusMap[membership.status] ?? {
    label: membership.status,
    className: "bg-white/5 text-gray-400 border border-white/10",
  };

  const canCancel = membership.status === "ACTIVE" || membership.status === "TRIALING";

  return (
    <>
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-5">
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Minha Assinatura</h1>

        {/* Plano atual */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#009CD9]" />
            <h2 className="text-base font-semibold text-[#EEE6E4]">Plano atual</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[#EEE6E4] font-medium text-lg">
                {membership.plan?.name ?? "Detailer'HUB"}
              </p>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            {membership.plan && (
              <p className="text-2xl font-bold text-[#EEE6E4]">
                {formatPrice(membership.plan.price, membership.plan.interval)}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>
                Próximo vencimento:{" "}
                <span className="text-[#EEE6E4]">
                  {formatDate(membership.currentPeriodEnd)}
                </span>
              </span>
            </div>
          </div>

          {membership.cancelAtPeriodEnd && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-400">
                Sua assinatura será cancelada em{" "}
                <strong>{formatDate(membership.currentPeriodEnd)}</strong>. Você
                mantém acesso até lá.
              </p>
            </div>
          )}

          {membership.status === "PAST_DUE" && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">
                Há um problema com seu pagamento. Entre em contato com{" "}
                <a
                  href="mailto:suporte@detailerhub.com"
                  className="underline hover:text-red-300 transition-colors"
                >
                  suporte@detailerhub.com
                </a>{" "}
                para regularizar.
              </p>
            </div>
          )}

          {canCancel && !membership.cancelAtPeriodEnd && (
            <div className="pt-1">
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                Cancelar assinatura
              </button>
            </div>
          )}
        </div>

        {/* Método de pagamento */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-[#EEE6E4]">Método de pagamento</h2>
          </div>
          <p className="text-sm text-gray-400">
            O pagamento é gerenciado pelo Asaas. Para atualizar seu cartão, entre em
            contato com{" "}
            <a
              href="mailto:suporte@detailerhub.com"
              className="text-[#009CD9] hover:underline transition-colors"
            >
              suporte@detailerhub.com
            </a>
            .
          </p>
        </div>

        {/* Histórico */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-[#EEE6E4]">Histórico de pagamentos</h2>
          </div>
          <p className="text-sm text-gray-500 py-4 text-center">
            Histórico de pagamentos em breve.
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancelar assinatura?"
        description={`Você perderá acesso a todas as comunidades e conteúdos da plataforma.${canceling ? "" : " O cancelamento entra em vigor imediatamente."}`}
        confirmLabel={canceling ? "Cancelando..." : "Confirmar cancelamento"}
        cancelLabel="Voltar"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </>
  );
}
