"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Bell,
  Gift,
  Star,
  Globe,
  Camera,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/badge";
import { useUploadThing } from "@/utils/uploadthing";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  referralCode: string | null;
  notificationPrefs?: Record<string, boolean>;
}

type Tab = "profile" | "security" | "notifications" | "referral" | "subscription" | "influencer";

interface MembershipPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  interval: string;
  intervalCount: number;
}

interface PlatformMembershipData {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  plan: MembershipPlan;
}

interface PaymentItem {
  id: string;
  amount: string;
  currency: string;
  status: string;
  stripeInvoiceId: string | null;
  description: string | null;
  createdAt: string;
}

const NOTIF_KEYS = [
  { key: "newLives", label: "Novas lives", desc: "Aviso quando uma live começar" },
  { key: "newContent", label: "Novos conteúdos", desc: "Módulos e aulas publicadas" },
  { key: "newMembers", label: "Novos membros", desc: "Quando alguém entrar na sua comunidade" },
  { key: "payments", label: "Pagamentos", desc: "Confirmações de assinatura e receita" },
];

export default function SettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    avatarUrl: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [copied, setCopied] = useState(false);

  // Notification prefs (F5)
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    newLives: true,
    newContent: true,
    newMembers: true,
    payments: true,
  });
  const notifDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscription tab state
  const [membership, setMembership] = useState<PlatformMembershipData | null | undefined>(undefined);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { startUpload } = useUploadThing("avatarUploader", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        setProfileForm((p) => ({ ...p, avatarUrl: url }));
        setAvatarPreview(url);
      }
      setAvatarUploading(false);
    },
    onUploadError: () => {
      setAvatarUploading(false);
    },
  });

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    startUpload([file]);
  }

  // Influencer profile (F6)
  const [influencerForm, setInfluencerForm] = useState({
    displayName: "",
    bio: "",
    websiteUrl: "",
    instagram: "",
    youtube: "",
    twitter: "",
    website: "",
  });
  const [influencerMsg, setInfluencerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [influencerSaving, setInfluencerSaving] = useState(false);

  // Invite link state (influencer only)
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteStats, setInviteStats] = useState<{ totalReferred: number; activeReferred: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);

    fetch("/api/users/me/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const u = d.data;
          setUser(u);
          setProfileForm({
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            phone: u.phone ?? "",
            avatarUrl: u.avatarUrl ?? "",
          });
          if (u.notificationPrefs && typeof u.notificationPrefs === "object") {
            setNotifPrefs((prev) => ({ ...prev, ...(u.notificationPrefs as Record<string, boolean>) }));
          }
        }
      })
      .finally(() => setIsLoading(false));

    if (role === "INFLUENCER_ADMIN") {
      fetch("/api/influencers/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            const links = (typeof d.data.socialLinks === "object" && d.data.socialLinks !== null)
              ? d.data.socialLinks as Record<string, string>
              : {};
            setInfluencerForm({
              displayName: d.data.displayName ?? "",
              bio: d.data.bio ?? "",
              websiteUrl: d.data.websiteUrl ?? "",
              instagram: links.instagram ?? "",
              youtube: links.youtube ?? "",
              twitter: links.twitter ?? "",
              website: links.website ?? "",
            });
          }
        })
        .catch(() => {});

      fetch("/api/influencers/me/invite-link", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            setInviteLink(d.data.inviteLink);
            setInviteStats(d.data.stats);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Load membership data when subscription tab is opened
  useEffect(() => {
    if (activeTab !== "subscription" || membership !== undefined) return;
    setMembershipLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch("/api/platform-membership/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMembership(d.data.membership ?? null);
        } else {
          setMembership(null);
        }
      })
      .catch(() => setMembership(null))
      .finally(() => setMembershipLoading(false));
  }, [activeTab, membership]);

  // Load payments when subscription tab is open and membership is loaded
  useEffect(() => {
    if (activeTab !== "subscription" || membership === undefined) return;
    setPaymentsLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    fetch(`/api/users/me/payments?page=${paymentsPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPayments(d.data);
          setPaymentsTotalPages(d.pagination.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, [activeTab, membership, paymentsPage]);

  async function openBillingPortal() {
    setBillingPortalLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const returnUrl = `${window.location.origin}/dashboard/settings`;
      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Erro ao acessar portal de cobrança");
        return;
      }
      window.open(data.data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Erro ao acessar portal de cobrança");
    } finally {
      setBillingPortalLoading(false);
    }
  }

  function formatCurrency(amount: string, currency: string) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(Number(amount));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  function getMembershipStatusLabel(status: string): { label: string; className: string } {
    switch (status) {
      case "ACTIVE": return { label: "Ativa", className: "bg-green-500/20 text-green-400 border border-green-500/30" };
      case "TRIALING": return { label: "Período de teste", className: "bg-[#007A99]/20 text-[#009CD9] border border-[#007A99]/30" };
      case "PAST_DUE": return { label: "Pagamento pendente", className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" };
      case "CANCELED": return { label: "Cancelada", className: "bg-red-500/20 text-red-400 border border-red-500/30" };
      case "EXPIRED": return { label: "Expirada", className: "bg-white/50/20 text-gray-400 border border-gray-500/30" };
      default: return { label: status, className: "bg-white/50/20 text-gray-400 border border-gray-500/30" };
    }
  }

  function getPaymentStatusLabel(status: string): { label: string; className: string } {
    switch (status) {
      case "SUCCEEDED": return { label: "Aprovado", className: "bg-green-500/20 text-green-400" };
      case "FAILED": return { label: "Falhou", className: "bg-red-500/20 text-red-400" };
      case "PENDING": return { label: "Pendente", className: "bg-yellow-500/20 text-yellow-400" };
      case "REFUNDED": return { label: "Reembolsado", className: "bg-[#007A99]/20 text-[#009CD9]" };
      default: return { label: status, className: "bg-white/50/20 text-gray-400" };
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setIsSaving(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch("/api/users/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone || null,
          avatarUrl: profileForm.avatarUrl || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setProfileMsg({ type: "error", text: data.error ?? "Erro ao salvar perfil" });
        return;
      }
      localStorage.setItem(STORAGE_KEYS.USER_NAME, `${profileForm.firstName} ${profileForm.lastName}`);
      setProfileMsg({ type: "success", text: "Perfil atualizado com sucesso!" });
      setUser((prev) => prev ? { ...prev, ...data.data } : null);
    } finally {
      setIsSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "As senhas não coincidem" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "A nova senha deve ter pelo menos 8 caracteres" });
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch("/api/users/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordMsg({ type: "error", text: data.error ?? "Erro ao alterar senha" });
        return;
      }
      setPasswordMsg({ type: "success", text: "Senha alterada com sucesso!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } finally {
      setIsSaving(false);
    }
  }

  function toggleNotif(key: string) {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    if (notifDebounce.current) clearTimeout(notifDebounce.current);
    notifDebounce.current = setTimeout(() => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      fetch("/api/users/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationPrefs: next }),
      }).catch(console.error);
    }, 300);
  }

  async function saveInfluencer(e: React.FormEvent) {
    e.preventDefault();
    setInfluencerMsg(null);
    setInfluencerSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (influencerForm.instagram) socialLinks.instagram = influencerForm.instagram;
      if (influencerForm.youtube) socialLinks.youtube = influencerForm.youtube;
      if (influencerForm.twitter) socialLinks.twitter = influencerForm.twitter;
      if (influencerForm.website) socialLinks.website = influencerForm.website;
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch("/api/influencers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          displayName: influencerForm.displayName,
          bio: influencerForm.bio || null,
          websiteUrl: influencerForm.websiteUrl || null,
          socialLinks,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setInfluencerMsg({ type: "error", text: data.error ?? "Erro ao salvar perfil público" });
      } else {
        setInfluencerMsg({ type: "success", text: "Perfil público atualizado!" });
      }
    } finally {
      setInfluencerSaving(false);
    }
  }

  function copyReferral() {
    const textToCopy = inviteLink ?? user?.referralCode;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-[#007A99] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-gray-500">Erro ao carregar configurações.</div>;
  }

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Perfil", icon: User },
    { key: "security", label: "Segurança", icon: Lock },
    { key: "notifications", label: "Notificações", icon: Bell },
    { key: "subscription", label: "Assinatura", icon: CreditCard },
    ...(user.role === "INFLUENCER_ADMIN"
      ? [
          { key: "referral" as Tab, label: "Link de Convite", icon: Gift },
          { key: "influencer" as Tab, label: "Perfil Público", icon: Star },
        ]
      : []),
  ];

  function InputField({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 hover:border-[#009CD9]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9] transition-all text-sm"
        />
      </div>
    );
  }

  function AlertBanner({ msg }: { msg: { type: "success" | "error"; text: string } }) {
    return (
      <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
        msg.type === "success"
          ? "bg-green-500/10 border-green-500/30 text-green-400"
          : "bg-red-500/10 border-red-500/30 text-red-400"
      }`}>
        {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {msg.text}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile card */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.firstName} width={64} height={64} className="w-full h-full rounded-2xl object-cover" />
          ) : initials}
        </div>
        <div>
          <p className="font-semibold text-[#EEE6E4]">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-400 mb-1">{user.email}</p>
          <RoleBadge role={user.role} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === key
                ? "bg-[#006079] text-white shadow-lg shadow-[#007A99]/20"
                : "text-gray-400 hover:text-[#EEE6E4]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Informações do Perfil</h2>
          {profileMsg && <AlertBanner msg={profileMsg} />}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Nome"
              value={profileForm.firstName}
              onChange={(e: any) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
            />
            <InputField
              label="Sobrenome"
              value={profileForm.lastName}
              onChange={(e: any) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
            />
          </div>
          <InputField label="Email" value={user.email} disabled />
          <p className="text-xs text-gray-500 -mt-2">O email não pode ser alterado</p>
          <InputField
            label="Telefone"
            value={profileForm.phone}
            onChange={(e: any) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
            type="tel"
            placeholder="+55 11 99999-9999"
          />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Foto de perfil</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
                {(avatarPreview || profileForm.avatarUrl) ? (
                  <Image src={avatarPreview || profileForm.avatarUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
                ) : initials}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#006079]/10 border border-white/10 hover:border-[#009CD9]/20 rounded-xl text-sm text-gray-400 hover:text-[#EEE6E4] transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {avatarUploading ? "Enviando..." : "Trocar foto"}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG até 4MB</p>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <form onSubmit={changePassword} className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Alterar Senha</h2>
          {passwordMsg && <AlertBanner msg={passwordMsg} />}
          <InputField
            label="Senha atual"
            value={passwordForm.currentPassword}
            onChange={(e: any) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            type="password"
          />
          <InputField
            label="Nova senha"
            value={passwordForm.newPassword}
            onChange={(e: any) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
            type="password"
            placeholder="Mínimo 8 caracteres"
          />
          <InputField
            label="Confirmar nova senha"
            value={passwordForm.confirmPassword}
            onChange={(e: any) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            type="password"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              {isSaving ? "Alterando..." : "Alterar Senha"}
            </button>
          </div>
        </form>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Notificações</h2>
          <div className="space-y-3">
            {NOTIF_KEYS.map(({ key, label, desc }) => {
              const isOn = notifPrefs[key] !== false;
              return (
                <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-[#EEE6E4] text-sm font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotif(key)}
                    className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${
                      isOn ? "bg-[#006079]" : "bg-white/20"
                    }`}
                    aria-checked={isOn}
                    role="switch"
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white/5 rounded-full transition-transform ${
                        isOn ? "right-1 translate-x-0" : "left-1 -translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral tab — influencer only */}
      {activeTab === "referral" && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Link de Convite</h2>
          <p className="text-gray-400 text-sm">
            Use este link personalizado para convidar sua audiência. Cada membro que entrar pelo seu link é registrado como seu — a comissão é permanente enquanto ele permanecer ativo.
          </p>
          {inviteLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Seu link de convite personalizado</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#EEE6E4] text-sm truncate"
                  />
                  <button
                    type="button"
                    onClick={copyReferral}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-white/5 hover:bg-[#006079]/10 text-gray-400 border border-white/10"
                    }`}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Compartilhe este link no YouTube, Instagram e WhatsApp. Cada membro que entrar por ele é seu — para sempre.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                  <p className="text-2xl font-bold text-[#EEE6E4]">{inviteStats?.totalReferred ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Total captados</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-green-500/30">
                  <p className="text-2xl font-bold text-green-400">{inviteStats?.activeReferred ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Ativos hoje</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Link de convite não disponível. Entre em contato com o suporte.
            </div>
          )}
        </div>
      )}

      {/* Subscription tab */}
      {activeTab === "subscription" && (
        <div className="space-y-4">
          {membershipLoading ? (
            <div className="glass-card p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-10 bg-white/10 rounded" />
            </div>
          ) : membership === null ? (
            <div className="glass-card p-8 text-center space-y-4">
              <CreditCard className="w-12 h-12 text-gray-500 mx-auto" />
              <h2 className="text-base font-semibold text-[#EEE6E4]">Sem assinatura ativa</h2>
              <p className="text-gray-400 text-sm">
                Assine a plataforma para acessar todas as comunidades e conteúdos exclusivos.
              </p>
              <a
                href="/dashboard/assinar"
                className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Ver planos
              </a>
            </div>
          ) : membership ? (
            <>
              {/* Status card */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#EEE6E4]">{membership.plan.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {formatCurrency(membership.plan.price, membership.plan.currency)}
                      {" / "}
                      {membership.plan.intervalCount > 1 ? membership.plan.intervalCount + " " : ""}
                      {membership.plan.interval === "year" ? "ano" : membership.plan.interval === "month" ? "mês" : membership.plan.interval}
                    </p>
                  </div>
                  {(() => {
                    const { label, className } = getMembershipStatusLabel(membership.status);
                    return (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Início do período</p>
                    <p className="text-sm font-medium text-[#EEE6E4]">{formatDate(membership.currentPeriodStart)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">
                      {membership.cancelAtPeriodEnd ? "Acesso até" : "Próxima renovação"}
                    </p>
                    <p className="text-sm font-medium text-[#EEE6E4]">{formatDate(membership.currentPeriodEnd)}</p>
                  </div>
                </div>

                {membership.cancelAtPeriodEnd && (
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-400">
                      Sua assinatura foi cancelada e expirará em {formatDate(membership.currentPeriodEnd)}.
                    </p>
                  </div>
                )}

                {membership.status === "PAST_DUE" && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">
                      Há um problema com seu pagamento. Atualize seu método de pagamento para manter o acesso.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={billingPortalLoading}
                  className="flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {billingPortalLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <ExternalLink className="w-4 h-4" />
                  }
                  {billingPortalLoading ? "Abrindo..." : "Gerenciar Assinatura"}
                </button>
              </div>

              {/* Payment history */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h2 className="text-base font-semibold text-[#EEE6E4]">Histórico de Pagamentos</h2>
                </div>

                {paymentsLoading ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-white/10 rounded-xl" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum pagamento encontrado.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {payments.map((p) => {
                        const { label, className } = getPaymentStatusLabel(p.status);
                        return (
                          <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-sm text-[#EEE6E4] font-medium">
                                {p.description ?? "Assinatura da plataforma"}
                              </p>
                              <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
                                {label}
                              </span>
                              <span className="text-sm font-semibold text-[#EEE6E4]">
                                {formatCurrency(p.amount, p.currency)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {paymentsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={paymentsPage <= 1}
                          onClick={() => setPaymentsPage((p) => p - 1)}
                          className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg text-gray-400 transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-gray-400">
                          {paymentsPage} / {paymentsTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={paymentsPage >= paymentsTotalPages}
                          onClick={() => setPaymentsPage((p) => p + 1)}
                          className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg text-gray-400 transition-all"
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Influencer public profile tab (F6) */}
      {activeTab === "influencer" && (
        <form onSubmit={saveInfluencer} className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-[#009CD9]" />
            <h2 className="text-base font-semibold text-[#EEE6E4]">Perfil Público</h2>
          </div>
          <p className="text-gray-400 text-xs -mt-2">
            Estas informações aparecem na página pública das suas comunidades.
          </p>
          {influencerMsg && <AlertBanner msg={influencerMsg} />}
          <InputField
            label="Nome de exibição"
            value={influencerForm.displayName}
            onChange={(e: any) => setInfluencerForm((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Como você quer ser conhecido"
          />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Bio</label>
            <textarea
              value={influencerForm.bio}
              onChange={(e) => setInfluencerForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              placeholder="Conte um pouco sobre você..."
              className="w-full bg-white/5 border border-white/10 hover:border-[#009CD9]/20 focus:border-[#009CD9] rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm resize-none"
            />
          </div>
          <InputField
            label="URL do site"
            value={influencerForm.websiteUrl}
            onChange={(e: any) => setInfluencerForm((p) => ({ ...p, websiteUrl: e.target.value }))}
            type="url"
            placeholder="https://seusite.com.br"
          />
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-400">Redes sociais</label>
            {[
              { key: "instagram" as const, label: "Instagram", placeholder: "https://instagram.com/seu_perfil" },
              { key: "youtube" as const, label: "YouTube", placeholder: "https://youtube.com/@seu_canal" },
              { key: "twitter" as const, label: "Twitter / X", placeholder: "https://twitter.com/seu_usuario" },
              { key: "website" as const, label: "Website", placeholder: "https://seusite.com.br" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="url"
                  value={influencerForm[key]}
                  onChange={(e) => setInfluencerForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-white/10 hover:border-[#009CD9]/20 focus:border-[#009CD9] rounded-xl px-4 py-2.5 text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={influencerSaving}
              className="flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
            >
              {influencerSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {influencerSaving ? "Salvando..." : "Salvar Perfil Público"}
            </button>
          </div>
        </form>
      )}

      {/* Account info */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-[#EEE6E4] mb-3">Informações da Conta</h2>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Membro desde</dt>
            <dd className="text-gray-400 font-medium">
              {new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Tipo de conta</dt>
            <dd><RoleBadge role={user.role} /></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
