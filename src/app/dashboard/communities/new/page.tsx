"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, Search, X, UserCheck, AlertTriangle } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

const COLORS = [
  "#006079", "#007A99", "#009CD9", "#ec4899", "#ef4444",
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
  return "w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm";
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  INFLUENCER_ADMIN: "Influencer",
  COMMUNITY_MEMBER: "Membro",
  MARKETPLACE_PARTNER: "Parceiro",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-500",
  INFLUENCER_ADMIN: "bg-[#007A99]/10 text-[#006079]",
  COMMUNITY_MEMBER: "bg-blue-500/10 text-blue-500",
  MARKETPLACE_PARTNER: "bg-green-500/10 text-green-600",
};

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function NewCommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Influencer search
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "",
    primaryColor: "#006079", isPrivate: false, tags: "",
    welcomeMessage: "", rules: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced user search
  useEffect(() => {
    if (!userSearch.trim() || selectedUser) {
      setUserResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const res = await fetch(`/api/users?search=${encodeURIComponent(userSearch)}&pageSize=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (d.success) {
          setUserResults(d.data ?? []);
          setShowDropdown(true);
        }
      } catch {
        // ignore
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
  }, [userSearch, selectedUser]);

  function selectUser(user: UserResult) {
    setSelectedUser(user);
    setUserSearch("");
    setShowDropdown(false);
    setUserResults([]);
  }

  function clearUser() {
    setSelectedUser(null);
    setUserSearch("");
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, ...(!slugManuallyEdited && { slug: slugify(name) }) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) { setError("Selecione o influencer responsável pela comunidade."); return; }
    setError("");
    setIsLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
          influencerUserId: selectedUser.id,
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
        <Link href="/dashboard/communities" className="p-2 text-gray-500 hover:text-[#EEE6E4] hover:bg-white/10 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Nova Comunidade</h1>
          <p className="text-gray-400 text-sm mt-0.5">Crie uma comunidade e atribua a um influencer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Influencer search */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Influencer Responsável</h2>
          <p className="text-xs text-gray-400">Pesquise qualquer membro da plataforma. Se não for Influencer, será promovido automaticamente.</p>

          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 bg-[#E6F4F7] border border-[#99D3DF] rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006079] to-[#007A99] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedUser.firstName[0]}{selectedUser.lastName?.[0] ?? ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#EEE6E4]">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedUser.role !== "INFLUENCER_ADMIN" ? (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-lg">
                    <AlertTriangle className="w-3 h-3" />
                    Será promovido a Influencer
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-[#006079] bg-[#007A99]/10 px-2 py-1 rounded-lg">
                    <UserCheck className="w-3 h-3" />
                    Já é Influencer
                  </div>
                )}
                <button type="button" onClick={clearUser} className="text-gray-400 hover:text-gray-400 p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl pl-10 pr-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm"
                />
                {userSearchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#009CD9] border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {showDropdown && userResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/5 border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden">
                  {userResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E6F4F7] transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006079] to-[#007A99] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.firstName[0]}{user.lastName?.[0] ?? ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#EEE6E4]">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0 ${ROLE_COLORS[user.role] ?? "bg-white/10 text-gray-500"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && userSearch && !userSearchLoading && userResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/5 border border-white/10 rounded-xl shadow-lg z-20 px-4 py-3 text-sm text-gray-400">
                  Nenhum usuário encontrado.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informações básicas */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Informações Básicas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome da comunidade <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Detailer'HUB Racing Pro" className={fieldClass()} required minLength={3} maxLength={80} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">URL da comunidade <span className="text-red-400">*</span></label>
            <div className="flex items-center bg-white/5 border border-white/10 hover:border-[#99D3DF] focus-within:border-[#007A99]/50 focus-within:ring-2 focus-within:ring-[#007A99]/30 rounded-xl overflow-hidden transition-all">
              <span className="bg-white/10 px-4 py-3 text-sm text-gray-400 border-r border-white/10 shrink-0">detailhub.com/</span>
              <input type="text" value={form.slug}
                onChange={(e) => { setSlugManuallyEdited(true); setForm((p) => ({ ...p, slug: slugify(e.target.value) })); }}
                placeholder="minha-comunidade"
                className="flex-1 px-4 py-3 text-sm text-[#EEE6E4] placeholder-gray-500 bg-transparent focus:outline-none"
                required minLength={3} maxLength={60} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1"><Info className="w-3 h-3" />Apenas letras minúsculas, números e hífens</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Descrição curta</label>
            <input type="text" value={form.shortDescription}
              onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
              placeholder="Uma linha sobre a comunidade" className={fieldClass()} maxLength={160} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Descrição completa</label>
            <textarea value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descreva o propósito e benefícios da comunidade..." className={fieldClass()} rows={4} maxLength={2000} />
          </div>
        </div>

        {/* Aparência */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#EEE6E4]">Aparência e Visibilidade</h2>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Cor principal</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setForm((p) => ({ ...p, primaryColor: color }))}
                  className={`w-8 h-8 rounded-lg transition-all ${form.primaryColor === color ? "ring-2 ring-offset-2 ring-[#009CD9] scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#EEE6E4]">Comunidade privada</p>
              <p className="text-xs text-gray-400">Apenas membros convidados podem entrar</p>
            </div>
            <button type="button" onClick={() => setForm((p) => ({ ...p, isPrivate: !p.isPrivate }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isPrivate ? "bg-[#007A99]" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPrivate ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Tags</h2>
          <input type="text" value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="racing, tuning, offroad (separadas por vírgula)" className={fieldClass()} />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/communities" className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-xl text-sm font-medium text-center hover:bg-white/5 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={isLoading}
            className="flex-1 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm">
            {isLoading ? "Criando..." : "Criar Comunidade"}
          </button>
        </div>
      </form>
    </div>
  );
}
