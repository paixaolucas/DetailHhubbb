"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, ChevronDown } from "lucide-react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#64748b",
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 60);
}

function fieldClass() {
  return "w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm";
}

interface InfluencerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function NewCommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [influencers, setInfluencers] = useState<InfluencerUser[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "",
    primaryColor: "#8b5cf6", isPrivate: false, tags: "",
    welcomeMessage: "", rules: "", influencerUserId: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) return;
    fetch("/api/users?role=INFLUENCER_ADMIN&pageSize=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setInfluencers(d.data ?? []); })
      .catch(console.error);
  }, []);

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, ...(!slugManuallyEdited && { slug: slugify(name) }) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.influencerUserId) { setError("Selecione um influencer para a comunidade."); return; }
    setError("");
    setIsLoading(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, slug: form.slug,
          shortDescription: form.shortDescription || undefined,
          description: form.description || undefined,
          primaryColor: form.primaryColor, isPrivate: form.isPrivate,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          welcomeMessage: form.welcomeMessage || undefined,
          rules: form.rules || undefined,
          influencerUserId: form.influencerUserId,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Erro ao criar comunidade"); return; }
      router.push("/dashboard/communities");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally { setIsLoading(false); }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/communities" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Comunidade</h1>
          <p className="text-gray-400 text-sm mt-0.5">Crie uma comunidade e atribua a um influencer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Influencer selector */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Influencer Responsável</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Influencer <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={form.influencerUserId}
                onChange={(e) => setForm((p) => ({ ...p, influencerUserId: e.target.value }))}
                className={fieldClass() + " appearance-none pr-10"}
                required
              >
                <option value="">Selecione um influencer...</option>
                {influencers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} — {u.email}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {influencers.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5">Nenhum usuário com role Influencer encontrado.</p>
            )}
          </div>
        </div>

        {/* Informações básicas */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Informações Básicas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Nome da comunidade <span className="text-red-400">*</span>
            </label>
            <input
              type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: DetailHub Racing Pro" className={fieldClass()}
              required minLength={3} maxLength={80}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              URL da comunidade <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center bg-white border border-gray-200 hover:border-violet-200 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/30 rounded-xl overflow-hidden transition-all">
              <span className="bg-white px-4 py-3 text-sm text-gray-500 border-r border-gray-200 shrink-0">
                detailhub.com/
              </span>
              <input
                type="text" value={form.slug}
                onChange={(e) => { setSlugManuallyEdited(true); setForm((p) => ({ ...p, slug: slugify(e.target.value) })); }}
                placeholder="minha-comunidade"
                className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
                required minLength={3} maxLength={60}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrição curta</label>
            <input
              type="text" value={form.shortDescription}
              onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
              placeholder="Uma linha sobre a comunidade" className={fieldClass()} maxLength={160}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrição completa</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descreva o propósito e benefícios da comunidade..." className={fieldClass()}
              rows={4} maxLength={2000}
            />
          </div>
        </div>

        {/* Cor e visibilidade */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Aparência e Visibilidade</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Cor principal</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color} type="button"
                  onClick={() => setForm((p) => ({ ...p, primaryColor: color }))}
                  className={`w-8 h-8 rounded-lg transition-all ${form.primaryColor === color ? "ring-2 ring-offset-2 ring-violet-400 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Comunidade privada</p>
              <p className="text-xs text-gray-400">Apenas membros convidados podem entrar</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isPrivate: !p.isPrivate }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isPrivate ? "bg-violet-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPrivate ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tags</h2>
          <input
            type="text" value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="racing, tuning, offroad (separadas por vírgula)" className={fieldClass()}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/communities" className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium text-center hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit" disabled={isLoading}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {isLoading ? "Criando..." : "Criar Comunidade"}
          </button>
        </div>
      </form>
    </div>
  );
}
