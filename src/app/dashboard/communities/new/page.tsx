"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Info } from "lucide-react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#8b5cf6", "#64748b",
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

export default function NewCommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "",
    primaryColor: "#8b5cf6", isPrivate: false, tags: "",
    welcomeMessage: "", rules: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, ...(!slugManuallyEdited && { slug: slugify(name) }) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          <p className="text-gray-400 text-sm mt-0.5">Configure sua comunidade e comece a crescer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

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
              placeholder="Resumo em uma frase (aparece nos cards)" className={fieldClass()}
              maxLength={160}
            />
            <p className="text-xs text-gray-600 mt-1">{form.shortDescription.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrição completa</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descreva sua comunidade em detalhes..."
              rows={4} className={`${fieldClass()} resize-none`} maxLength={2000}
            />
          </div>
        </div>

        {/* Aparência */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Aparência</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Cor principal</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color} type="button"
                  onClick={() => setForm((p) => ({ ...p, primaryColor: color }))}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    form.primaryColor === color ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Configurações</h2>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setForm((p) => ({ ...p, isPrivate: !p.isPrivate }))}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.isPrivate ? "bg-violet-600" : "bg-gray-50"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${form.isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Comunidade privada</p>
              <p className="text-xs text-gray-500">Somente membros podem ver o conteúdo</p>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tags</label>
            <input
              type="text" value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              placeholder="tuning, racing, diagnóstico (separadas por vírgula)"
              className={fieldClass()}
            />
          </div>
        </div>

        {/* Conteúdo inicial */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Conteúdo Inicial</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Mensagem de boas-vindas</label>
            <textarea
              value={form.welcomeMessage}
              onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))}
              placeholder="Mensagem que os novos membros receberão ao entrar..."
              rows={3} className={`${fieldClass()} resize-none`} maxLength={5000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Regras da comunidade</label>
            <textarea
              value={form.rules}
              onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))}
              placeholder="Regras e diretrizes para os membros..."
              rows={3} className={`${fieldClass()} resize-none`} maxLength={5000}
            />
          </div>
        </div>

        {/* Preview */}
        {form.name && (
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Preview do Card</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-w-xs">
              <div className="h-20 relative" style={{ backgroundColor: form.primaryColor }}>
                <div className="absolute inset-0 grid-pattern opacity-20" />
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-900 font-bold text-lg -mt-6 border-2 border-gray-900"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{form.name}</p>
                    {form.shortDescription && (
                      <p className="text-xs text-gray-500 truncate">{form.shortDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard/communities" className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 transition-all">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || !form.name || !form.slug}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? "Criando..." : "Criar Comunidade"}
          </button>
        </div>
      </form>
    </div>
  );
}
