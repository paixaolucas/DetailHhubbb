"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Settings, Palette, Users, AlertTriangle,
  Save, Trash2, Plus, Check, UserX, Crown, HelpCircle, Star, Pencil, X, Zap, Megaphone,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import OnboardingChecklist from "@/components/community/OnboardingChecklist";

const TABS = [
  { id: "general", label: "Geral", icon: Settings },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "members", label: "Membros", icon: Users },
  { id: "broadcast", label: "Broadcast", icon: Megaphone },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "testimonials", label: "Depoimentos", icon: Star },
  { id: "danger", label: "Perigo", icon: AlertTriangle },
];

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#64748b",
];


interface Community {
  id: string; name: string; slug: string; description: string | null;
  shortDescription: string | null; primaryColor: string;
  logoUrl: string | null; bannerUrl: string | null;
  isPrivate: boolean; isPublished?: boolean; tags: string[];
  welcomeMessage: string | null; rules: string | null;
  _count?: { spaces?: number; subscriptionPlans?: number };
}

interface Member {
  id: string; status: string; role: string;
  user: { firstName: string; lastName: string; email: string };
}

interface FAQ {
  id: string; question: string; answer: string; sortOrder: number;
}

interface Testimonial {
  id: string; authorName: string; authorTitle: string | null;
  avatarUrl: string | null; body: string; rating: number | null;
  sortOrder: number; isActive: boolean;
}

function fieldClass() {
  return "w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm";
}

export default function CommunitySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("general");
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string;
    variant?: "danger" | "default"; onConfirm: () => void; confirmLabel?: string;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const [generalForm, setGeneralForm] = useState({
    name: "", slug: "", description: "", shortDescription: "",
    tags: "", welcomeMessage: "", rules: "", isPrivate: false,
  });

  const [appearanceForm, setAppearanceForm] = useState({
    primaryColor: "#8b5cf6", logoUrl: "", bannerUrl: "",
  });

  // Points allocation modal
  const [pointsModal, setPointsModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false, userId: "", userName: "",
  });
  const [pointsForm, setPointsForm] = useState({ amount: "", type: "EARNED", reason: "" });
  const [pointsSaving, setPointsSaving] = useState(false);


  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsLoaded, setFaqsLoaded] = useState(false);
  const [showNewFaq, setShowNewFaq] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", sortOrder: "0" });

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);
  const [showNewTestimonial, setShowNewTestimonial] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    authorName: "", authorTitle: "", avatarUrl: "", body: "", rating: "5", sortOrder: "0",
  });

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({ title: "", body: "", link: "" });
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    const role = localStorage.getItem("detailhub_user_role");
    setIsAdmin(role === "SUPER_ADMIN");
    Promise.all([
      fetch(`/api/communities/${communityId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`/api/communities/${communityId}/members`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([commData, membersData]) => {
      if (commData.success) {
        const c = commData.data;
        setCommunity(c);
        setGeneralForm({
          name: c.name ?? "", slug: c.slug ?? "",
          description: c.description ?? "", shortDescription: c.shortDescription ?? "",
          tags: Array.isArray(c.tags) ? c.tags.join(", ") : "",
          welcomeMessage: c.welcomeMessage ?? "", rules: c.rules ?? "",
          isPrivate: c.isPrivate ?? false,
        });
        setAppearanceForm({
          primaryColor: c.primaryColor ?? "#8b5cf6",
          logoUrl: c.logoUrl ?? "", bannerUrl: (c as any).bannerUrl ?? "",
        });
      }
      if (membersData.success) setMembers(membersData.data ?? []);
    }).finally(() => setIsLoading(false));
  }, [communityId]);

  async function save(body: Record<string, unknown>) {
    setSaving(true); setError(""); setSuccess("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setSuccess("Salvo com sucesso!"); if (data.data) setCommunity(data.data); }
      else setError(data.error ?? "Erro ao salvar");
    } finally { setSaving(false); }
  }

  async function removeMember(membershipId: string) {
    setConfirmState({
      open: true, title: "Remover membro?",
      description: "O membro perderá acesso à comunidade.",
      variant: "danger", confirmLabel: "Remover",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/communities/${communityId}/members/${membershipId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setMembers((m) => m.filter((mb) => mb.id !== membershipId));
      },
    });
  }

  async function allocatePoints(e: React.FormEvent) {
    e.preventDefault();
    setPointsSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}/members/${pointsModal.userId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseInt(pointsForm.amount, 10),
          type: pointsForm.type,
          reason: pointsForm.reason || undefined,
        }),
      });
      if (res.ok) {
        setPointsModal({ open: false, userId: "", userName: "" });
        setPointsForm({ amount: "", type: "EARNED", reason: "" });
      }
    } finally {
      setPointsSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // FAQ helpers
  // -------------------------------------------------------------------------
  async function loadFaqs() {
    if (faqsLoaded) return;
    const token = localStorage.getItem("detailhub_access_token");
    const res = await fetch(`/api/communities/${communityId}/faqs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setFaqs(data.data ?? []);
    setFaqsLoaded(true);
  }

  async function createFaq() {
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: faqForm.question,
          answer: faqForm.answer,
          sortOrder: parseInt(faqForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs((f) => [...f, data.data]);
        setShowNewFaq(false);
        setFaqForm({ question: "", answer: "", sortOrder: "0" });
      } else setError(data.error ?? "Erro");
    } finally { setSaving(false); }
  }

  async function updateFaq(faq: FAQ) {
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}/faqs/${faq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: faqForm.question,
          answer: faqForm.answer,
          sortOrder: parseInt(faqForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs((f) => f.map((item) => (item.id === faq.id ? data.data : item)));
        setEditingFaq(null);
        setFaqForm({ question: "", answer: "", sortOrder: "0" });
      } else setError(data.error ?? "Erro");
    } finally { setSaving(false); }
  }

  async function deleteFaq(faqId: string) {
    setConfirmState({
      open: true, title: "Excluir pergunta?",
      description: "Esta pergunta frequente será removida.",
      variant: "danger", confirmLabel: "Excluir",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/communities/${communityId}/faqs/${faqId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setFaqs((f) => f.filter((item) => item.id !== faqId));
      },
    });
  }

  // -------------------------------------------------------------------------
  // Testimonial helpers
  // -------------------------------------------------------------------------
  async function loadTestimonials() {
    if (testimonialsLoaded) return;
    const token = localStorage.getItem("detailhub_access_token");
    const res = await fetch(`/api/communities/${communityId}/testimonials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setTestimonials(data.data ?? []);
    setTestimonialsLoaded(true);
  }

  async function createTestimonial() {
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}/testimonials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          authorName: testimonialForm.authorName,
          authorTitle: testimonialForm.authorTitle || undefined,
          avatarUrl: testimonialForm.avatarUrl || undefined,
          body: testimonialForm.body,
          rating: parseInt(testimonialForm.rating) || undefined,
          sortOrder: parseInt(testimonialForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestimonials((t) => [...t, data.data]);
        setShowNewTestimonial(false);
        setTestimonialForm({ authorName: "", authorTitle: "", avatarUrl: "", body: "", rating: "5", sortOrder: "0" });
      } else setError(data.error ?? "Erro");
    } finally { setSaving(false); }
  }

  async function updateTestimonial(t: Testimonial) {
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}/testimonials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          authorName: testimonialForm.authorName,
          authorTitle: testimonialForm.authorTitle || undefined,
          avatarUrl: testimonialForm.avatarUrl || undefined,
          body: testimonialForm.body,
          rating: parseInt(testimonialForm.rating) || undefined,
          sortOrder: parseInt(testimonialForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestimonials((list) => list.map((item) => (item.id === t.id ? data.data : item)));
        setEditingTestimonial(null);
        setTestimonialForm({ authorName: "", authorTitle: "", avatarUrl: "", body: "", rating: "5", sortOrder: "0" });
      } else setError(data.error ?? "Erro");
    } finally { setSaving(false); }
  }

  async function deleteTestimonial(testimonialId: string) {
    setConfirmState({
      open: true, title: "Excluir depoimento?",
      description: "Este depoimento será removido permanentemente.",
      variant: "danger", confirmLabel: "Excluir",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/communities/${communityId}/testimonials/${testimonialId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setTestimonials((list) => list.filter((item) => item.id !== testimonialId));
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-400">Comunidade não encontrada.</p>
        <Link href="/dashboard/communities" className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/communities" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-400 text-sm mt-0.5">{community.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 mb-6 overflow-x-auto">
        {TABS.filter((t) => t.id !== "danger" || isAdmin).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
            setActiveTab(id);
            setError(""); setSuccess("");
            if (id === "faq") loadFaqs();
            if (id === "testimonials") loadTestimonials();
          }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === id
                ? id === "danger" ? "bg-red-600 text-white" : "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                : id === "danger" ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* GENERAL */}
      {activeTab === "general" && (
        <>
          {community && (
            <OnboardingChecklist community={community} />
          )}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Informações Gerais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Nome *</label>
              <input type="text" value={generalForm.name} onChange={(e) => setGeneralForm((p) => ({ ...p, name: e.target.value }))} className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Slug (URL)</label>
              <input type="text" value={generalForm.slug} onChange={(e) => setGeneralForm((p) => ({ ...p, slug: e.target.value }))} className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Tags</label>
              <input type="text" value={generalForm.tags} onChange={(e) => setGeneralForm((p) => ({ ...p, tags: e.target.value }))} placeholder="tuning, racing" className={fieldClass()} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrição curta</label>
              <input type="text" value={generalForm.shortDescription} onChange={(e) => setGeneralForm((p) => ({ ...p, shortDescription: e.target.value }))} className={fieldClass()} maxLength={160} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrição completa</label>
              <textarea value={generalForm.description} onChange={(e) => setGeneralForm((p) => ({ ...p, description: e.target.value }))} rows={4} className={`${fieldClass()} resize-none`} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setGeneralForm((p) => ({ ...p, isPrivate: !p.isPrivate }))} className={`w-11 h-6 rounded-full transition-colors relative ${generalForm.isPrivate ? "bg-violet-600" : "bg-gray-50"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${generalForm.isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-600">Privada</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Mensagem de boas-vindas</label>
              <textarea value={generalForm.welcomeMessage} onChange={(e) => setGeneralForm((p) => ({ ...p, welcomeMessage: e.target.value }))} rows={3} className={`${fieldClass()} resize-none`} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Regras</label>
              <textarea value={generalForm.rules} onChange={(e) => setGeneralForm((p) => ({ ...p, rules: e.target.value }))} rows={3} className={`${fieldClass()} resize-none`} />
            </div>
          </div>
          <button onClick={() => save({ name: generalForm.name, slug: generalForm.slug, description: generalForm.description || undefined, shortDescription: generalForm.shortDescription || undefined, tags: generalForm.tags ? generalForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [], welcomeMessage: generalForm.welcomeMessage || undefined, rules: generalForm.rules || undefined, isPrivate: generalForm.isPrivate })} disabled={saving} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
        </>
      )}

      {/* APPEARANCE */}
      {activeTab === "appearance" && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Aparência</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Cor principal</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setAppearanceForm((p) => ({ ...p, primaryColor: color }))}
                  className={`w-10 h-10 rounded-xl transition-all ${appearanceForm.primaryColor === color ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">URL do Logo</label>
              <input type="url" value={appearanceForm.logoUrl} onChange={(e) => setAppearanceForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">URL da Capa</label>
              <input type="url" value={appearanceForm.bannerUrl} onChange={(e) => setAppearanceForm((p) => ({ ...p, bannerUrl: e.target.value }))} placeholder="https://..." className={fieldClass()} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Preview</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-w-xs">
              {appearanceForm.bannerUrl ? (
                <Image src={appearanceForm.bannerUrl} alt="cover" width={320} height={80} className="h-20 w-full object-cover" />
              ) : (
                <div className="h-20 relative grid-pattern opacity-20" style={{ backgroundColor: appearanceForm.primaryColor }} />
              )}
              <div className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-900 font-bold -mt-6 border-2 border-gray-900" style={{ backgroundColor: appearanceForm.primaryColor }}>
                    {community.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{community.name}</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => save({ primaryColor: appearanceForm.primaryColor, logoUrl: appearanceForm.logoUrl || undefined, bannerUrl: appearanceForm.bannerUrl || undefined })} disabled={saving} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      )}

      {/* MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Membros ({members.length})</h2>
          {members.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Nenhum membro ainda.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-white/5">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-4 hover:bg-violet-50 transition-colors">
                    <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-semibold text-sm flex-shrink-0">
                      {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {member.role === "ADMIN" && (
                        <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${member.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                        {member.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </span>
                      <button
                        onClick={() => {
                          setPointsModal({ open: true, userId: member.id, userName: `${member.user.firstName} ${member.user.lastName}` });
                          setPointsForm({ amount: "", type: "EARNED", reason: "" });
                        }}
                        title="Dar pontos"
                        className="p-1.5 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      {member.role !== "ADMIN" && (
                        <button onClick={() => removeMember(member.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Perguntas Frequentes</h2>
            <button
              onClick={() => { setShowNewFaq(true); setEditingFaq(null); setFaqForm({ question: "", answer: "", sortOrder: "0" }); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Nova Pergunta
            </button>
          </div>

          {(showNewFaq || editingFaq) && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{editingFaq ? "Editar Pergunta" : "Nova Pergunta"}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Pergunta *</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))}
                  placeholder="Ex: Como funciona o acesso?"
                  className={fieldClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Resposta *</label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))}
                  rows={4}
                  placeholder="Digite a resposta completa..."
                  className={`${fieldClass()} resize-none`}
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Ordem</label>
                <input
                  type="number"
                  value={faqForm.sortOrder}
                  onChange={(e) => setFaqForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  min="0"
                  className={fieldClass()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => (editingFaq ? updateFaq(editingFaq) : createFaq())}
                  disabled={saving || !faqForm.question || !faqForm.answer}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? "Salvando..." : editingFaq ? "Atualizar" : "Adicionar"}
                </button>
                <button
                  onClick={() => { setShowNewFaq(false); setEditingFaq(null); setFaqForm({ question: "", answer: "", sortOrder: "0" }); }}
                  className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {faqs.length === 0 && !showNewFaq ? (
            <div className="glass-card p-12 text-center">
              <HelpCircle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Nenhuma pergunta cadastrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="glass-card p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">{faq.question}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingFaq(faq);
                          setShowNewFaq(false);
                          setFaqForm({ question: faq.question, answer: faq.answer, sortOrder: String(faq.sortOrder) });
                        }}
                        className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TESTIMONIALS */}
      {activeTab === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Depoimentos</h2>
            <button
              onClick={() => { setShowNewTestimonial(true); setEditingTestimonial(null); setTestimonialForm({ authorName: "", authorTitle: "", avatarUrl: "", body: "", rating: "5", sortOrder: "0" }); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Depoimento
            </button>
          </div>

          {(showNewTestimonial || editingTestimonial) && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{editingTestimonial ? "Editar Depoimento" : "Novo Depoimento"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Nome do autor *</label>
                  <input
                    type="text"
                    value={testimonialForm.authorName}
                    onChange={(e) => setTestimonialForm((p) => ({ ...p, authorName: e.target.value }))}
                    placeholder="João Silva"
                    className={fieldClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Cargo / Título</label>
                  <input
                    type="text"
                    value={testimonialForm.authorTitle}
                    onChange={(e) => setTestimonialForm((p) => ({ ...p, authorTitle: e.target.value }))}
                    placeholder="Membro Premium"
                    className={fieldClass()}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">URL do Avatar</label>
                  <input
                    type="url"
                    value={testimonialForm.avatarUrl}
                    onChange={(e) => setTestimonialForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                    placeholder="https://..."
                    className={fieldClass()}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Depoimento *</label>
                  <textarea
                    value={testimonialForm.body}
                    onChange={(e) => setTestimonialForm((p) => ({ ...p, body: e.target.value }))}
                    rows={3}
                    placeholder="O que o membro disse sobre a comunidade..."
                    className={`${fieldClass()} resize-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Avaliação (1–5)</label>
                  <select
                    value={testimonialForm.rating}
                    onChange={(e) => setTestimonialForm((p) => ({ ...p, rating: e.target.value }))}
                    className={`${fieldClass()} bg-[#F8F7FF]`}
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{"★".repeat(r)} ({r})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Ordem</label>
                  <input
                    type="number"
                    value={testimonialForm.sortOrder}
                    onChange={(e) => setTestimonialForm((p) => ({ ...p, sortOrder: e.target.value }))}
                    min="0"
                    className={fieldClass()}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => (editingTestimonial ? updateTestimonial(editingTestimonial) : createTestimonial())}
                  disabled={saving || !testimonialForm.authorName || !testimonialForm.body}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? "Salvando..." : editingTestimonial ? "Atualizar" : "Adicionar"}
                </button>
                <button
                  onClick={() => { setShowNewTestimonial(false); setEditingTestimonial(null); setTestimonialForm({ authorName: "", authorTitle: "", avatarUrl: "", body: "", rating: "5", sortOrder: "0" }); }}
                  className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {testimonials.length === 0 && !showNewTestimonial ? (
            <div className="glass-card p-12 text-center">
              <Star className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Nenhum depoimento cadastrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map((t) => (
                <div key={t.id} className="glass-card p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{t.authorName}</p>
                        {t.authorTitle && <span className="text-xs text-gray-500">{t.authorTitle}</span>}
                        {t.rating && (
                          <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                            {"★".repeat(t.rating)}
                          </span>
                        )}
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${t.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                          {t.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">&ldquo;{t.body}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingTestimonial(t);
                          setShowNewTestimonial(false);
                          setTestimonialForm({
                            authorName: t.authorName,
                            authorTitle: t.authorTitle ?? "",
                            avatarUrl: t.avatarUrl ?? "",
                            body: t.body,
                            rating: String(t.rating ?? 5),
                            sortOrder: String(t.sortOrder),
                          });
                        }}
                        className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTestimonial(t.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BROADCAST */}
      {activeTab === "broadcast" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-violet-500" />
              Broadcast para Membros
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Envie uma notificação para todos os membros ativos da comunidade.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Título *</label>
              <input
                type="text"
                maxLength={100}
                placeholder="Ex: Nova aula disponível!"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{broadcastForm.title.length}/100</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Mensagem *</label>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Escreva sua mensagem para os membros..."
                value={broadcastForm.body}
                onChange={(e) => setBroadcastForm((f) => ({ ...f, body: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{broadcastForm.body.length}/500</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Link (opcional)</label>
              <input
                type="text"
                placeholder="Ex: /community/minha-comunidade/feed"
                value={broadcastForm.link}
                onChange={(e) => setBroadcastForm((f) => ({ ...f, link: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm"
              />
            </div>
          </div>

          <button
            disabled={broadcastSending || !broadcastForm.title.trim() || !broadcastForm.body.trim()}
            onClick={async () => {
              setBroadcastSending(true);
              try {
                const token = localStorage.getItem("detailhub_access_token");
                const res = await fetch(`/api/communities/${communityId}/broadcast`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    title: broadcastForm.title.trim(),
                    body: broadcastForm.body.trim(),
                    link: broadcastForm.link.trim() || undefined,
                  }),
                });
                const json = await res.json();
                if (json.success) {
                  toast.success(`Broadcast enviado para ${json.data.sent} membro(s)!`);
                  setBroadcastForm({ title: "", body: "", link: "" });
                } else {
                  toast.error(json.error ?? "Erro ao enviar broadcast");
                }
              } catch {
                toast.error("Erro de conexão");
              } finally {
                setBroadcastSending(false);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Megaphone className="w-4 h-4" />
            {broadcastSending ? "Enviando..." : "Enviar Broadcast"}
          </button>
        </div>
      )}

      {/* DANGER */}
      {activeTab === "danger" && isAdmin && (
        <div className="glass-card p-6 border-red-500/20 space-y-4">
          <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Zona de Perigo
          </h2>
          <div className="flex items-start justify-between gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Arquivar comunidade</h3>
              <p className="text-xs text-gray-400 mt-0.5">A comunidade ficará invisível para novos membros.</p>
            </div>
            <button
              onClick={() => setConfirmState({
                open: true, title: "Arquivar comunidade?",
                description: "A comunidade ficará invisível para novos membros.",
                variant: "danger", confirmLabel: "Arquivar",
                onConfirm: () => { setConfirmState((s) => ({ ...s, open: false })); save({ isPublished: false }); },
              })}
              className="flex-shrink-0 px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-sm font-medium transition-all"
            >
              Arquivar
            </button>
          </div>
          <div className="flex items-start justify-between gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Excluir comunidade</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ação irreversível. Todos os dados serão perdidos.</p>
            </div>
            <button
              onClick={() => setConfirmState({
                open: true, title: `Excluir "${community?.name}"?`,
                description: "ATENÇÃO: Ação irreversível. Todos os dados, membros e conteúdos serão permanentemente removidos.",
                variant: "danger", confirmLabel: "Excluir definitivamente",
                onConfirm: () => {
                  setConfirmState((s) => ({ ...s, open: false }));
                  const token = localStorage.getItem("detailhub_access_token");
                  fetch(`/api/communities/${communityId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
                    .then(() => router.push("/dashboard/communities"));
                },
              })}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel ?? "Confirmar"}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />

      {/* Points allocation modal */}
      {pointsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Dar Pontos — {pointsModal.userName}
              </h3>
              <button onClick={() => setPointsModal({ open: false, userId: "", userName: "" })} className="text-gray-500 hover:text-gray-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={allocatePoints} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Quantidade</label>
                <input
                  required
                  type="number"
                  value={pointsForm.amount}
                  onChange={(e) => setPointsForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="Ex: 50"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tipo</label>
                <select
                  value={pointsForm.type}
                  onChange={(e) => setPointsForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none"
                >
                  <option value="EARNED" className="bg-white">Ganho (+)</option>
                  <option value="SPENT" className="bg-white">Gasto (−)</option>
                  <option value="ADJUSTED" className="bg-white">Ajuste manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Ex: Participação em desafio"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setPointsModal({ open: false, userId: "", userName: "" })} className="flex-1 px-4 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-xl hover:bg-violet-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={pointsSaving} className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
                  {pointsSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                  {pointsSaving ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
