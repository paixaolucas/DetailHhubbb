"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { RoleBadge } from "@/components/ui/badge";
import { useUploadThing } from "@/utils/uploadthing";

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

type Tab = "profile" | "security" | "notifications" | "referral" | "influencer";

const NOTIF_KEYS = [
  { key: "newLives", label: "Novas lives", desc: "Aviso quando uma live começar" },
  { key: "newContent", label: "Novos conteúdos", desc: "Módulos e aulas publicadas" },
  { key: "newMembers", label: "Novos membros", desc: "Quando alguém entrar na sua comunidade" },
  { key: "payments", label: "Pagamentos", desc: "Confirmações de assinatura e receita" },
];

export default function SettingsPage() {
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

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    const role = localStorage.getItem("detailhub_user_role");

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
    }
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setIsSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
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
      localStorage.setItem("detailhub_user_name", `${profileForm.firstName} ${profileForm.lastName}`);
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
      const token = localStorage.getItem("detailhub_access_token");
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
      const token = localStorage.getItem("detailhub_access_token");
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
      const token = localStorage.getItem("detailhub_access_token");
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
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
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
    { key: "referral", label: "Referral", icon: Gift },
    ...(user.role === "INFLUENCER_ADMIN"
      ? [{ key: "influencer" as Tab, label: "Perfil Público", icon: Star }]
      : []),
  ];

  function InputField({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-200 hover:border-violet-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all text-sm"
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
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile card */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full rounded-2xl object-cover" />
          ) : initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-400 mb-1">{user.email}</p>
          <RoleBadge role={user.role} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === key
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                : "text-gray-400 hover:text-gray-900"
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
          <h2 className="text-base font-semibold text-gray-900">Informações do Perfil</h2>
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Foto de perfil</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
                {(avatarPreview || profileForm.avatarUrl) ? (
                  <img src={avatarPreview || profileForm.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : initials}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-200 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {avatarUploading ? "Enviando..." : "Trocar foto"}
                </button>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG até 4MB</p>
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
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
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
          <h2 className="text-base font-semibold text-gray-900">Alterar Senha</h2>
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
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
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
          <h2 className="text-base font-semibold text-gray-900">Notificações</h2>
          <div className="space-y-3">
            {NOTIF_KEYS.map(({ key, label, desc }) => {
              const isOn = notifPrefs[key] !== false;
              return (
                <div key={key} className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <div>
                    <p className="text-gray-900 text-sm font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotif(key)}
                    className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${
                      isOn ? "bg-violet-600" : "bg-white/20"
                    }`}
                    aria-checked={isOn}
                    role="switch"
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
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

      {/* Referral tab */}
      {activeTab === "referral" && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Programa de Referral</h2>
          <p className="text-gray-400 text-sm">
            Indique amigos e ganhe comissões recorrentes quando eles se cadastrarem na plataforma.
          </p>
          {user.referralCode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Seu código de referral</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={user.referralCode}
                    readOnly
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={copyReferral}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      copied
                        ? "bg-green-600 text-gray-900"
                        : "bg-gray-50 hover:bg-violet-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-xs text-gray-500 mt-1">Indicações</p>
                  <p className="text-xs text-gray-600 mt-0.5">Em breve</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-xs text-gray-500 mt-1">Comissões ganhas</p>
                  <p className="text-xs text-gray-600 mt-0.5">Em breve</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Código de referral não disponível para o seu plano atual.
            </div>
          )}
        </div>
      )}

      {/* Influencer public profile tab (F6) */}
      {activeTab === "influencer" && (
        <form onSubmit={saveInfluencer} className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-violet-400" />
            <h2 className="text-base font-semibold text-gray-900">Perfil Público</h2>
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Bio</label>
            <textarea
              value={influencerForm.bio}
              onChange={(e) => setInfluencerForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              placeholder="Conte um pouco sobre você..."
              className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm resize-none"
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
            <label className="block text-sm font-medium text-gray-600">Redes sociais</label>
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
                  className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={influencerSaving}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
            >
              {influencerSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {influencerSaving ? "Salvando..." : "Salvar Perfil Público"}
            </button>
          </div>
        </form>
      )}

      {/* Account info */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Informações da Conta</h2>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Membro desde</dt>
            <dd className="text-gray-600 font-medium">
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
