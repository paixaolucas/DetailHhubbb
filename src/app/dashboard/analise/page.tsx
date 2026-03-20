"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Film,
  User,
  FileText,
  Globe,
  Upload,
  Link2,
  Loader2,
  ChevronRight,
  Search,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { STORAGE_KEYS } from "@/lib/constants";
import { extractVideoFrames } from "@/utils/videoFrameExtractor";
import { uploadFiles } from "@/utils/upload";
import type { AIAnalysisType, AIAnalysisInputType, AIAnalysisSummary } from "@/types";

// ─── Analysis categories config ──────────────────────────────────────────────

const ANALYSIS_TYPES: {
  id: AIAnalysisType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  supports: AIAnalysisInputType[];
}[] = [
  {
    id: "AD_CREATIVE",
    label: "Criativo de Anúncio",
    description: "Analise imagens e vídeos de anúncios com pontuação detalhada e decisão SCALE/ITERATE/KILL.",
    icon: Film,
    color: "from-[#006079] to-[#009CD9]",
    supports: ["image", "video"],
  },
  {
    id: "PROFILE_AUDIT",
    label: "Auditoria de Perfil",
    description: "Avalie a qualidade do seu perfil social: bio, imagem, proposta de valor e consistência.",
    icon: User,
    color: "from-[#007A99] to-[#33A7BF]",
    supports: ["image", "url"],
  },
  {
    id: "POST_ANALYSIS",
    label: "Análise de Post",
    description: "Descubra o potencial de engajamento do seu conteúdo orgânico antes de publicar.",
    icon: FileText,
    color: "from-[#006079] to-[#007A99]",
    supports: ["image", "video", "url"],
  },
  {
    id: "SITE_ANALYSIS",
    label: "Análise de Site",
    description: "Avalie conversão, UX e CRO da sua landing page ou site com recomendações práticas.",
    icon: Globe,
    color: "from-[#004D61] to-[#006079]",
    supports: ["url"],
  },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "Plataforma (opcional)" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
];

const TYPE_LABELS: Record<AIAnalysisType, string> = {
  AD_CREATIVE: "Criativo",
  PROFILE_AUDIT: "Perfil",
  POST_ANALYSIS: "Post",
  SITE_ANALYSIS: "Site",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "text-green-400",
  FAILED: "text-red-400",
  PENDING: "text-yellow-400",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  COMPLETED: CheckCircle2,
  FAILED: AlertCircle,
  PENDING: Clock,
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // --- New analysis state ---
  const [selectedType, setSelectedType] = useState<AIAnalysisType | null>(null);
  const [inputType, setInputType] = useState<AIAnalysisInputType>("image");
  const [inputUrl, setInputUrl] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [platform, setPlatform] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- History state ---
  const [analyses, setAnalyses] = useState<AIAnalysisSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<AIAnalysisType | "">("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasPlatform = useCallback(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return false;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.hasPlatform === true;
    } catch {
      return false;
    }
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "";
  };

  // Load history
  const loadHistory = useCallback(
    async (page: number, type: AIAnalysisType | "") => {
      setHistoryLoading(true);
      try {
        const token = getToken();
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "10",
        });
        if (type) params.set("type", type);
        const res = await fetch(`/api/ai/analise?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setAnalyses(data.data ?? []);
          setHistoryTotal(data.meta?.total ?? 0);
          setHistoryTotalPages(data.meta?.totalPages ?? 1);
        }
      } catch {
        toast.error("Erro ao carregar histórico");
      } finally {
        setHistoryLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory(historyPage, historyFilter);
    }
  }, [activeTab, historyPage, historyFilter, loadHistory]);

  // File selection — usa FileReader para base64 estável (URL.createObjectURL pode expirar)
  function applyFile(f: File) {
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  }

  // Submit analysis
  async function handleSubmit() {
    if (!selectedType) return;

    const type = selectedType;

    // Validate
    if (inputType !== "url" && !file) {
      toast.error("Selecione um arquivo para análise");
      return;
    }
    if (inputType === "url" && !inputUrl.trim() && !pastedContent.trim()) {
      toast.error("Informe a URL ou cole o conteúdo para análise");
      return;
    }

    setAnalyzing(true);
    try {
      let fileUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let imageBase64Frames: string[] = [];

      if (file) {
        // Upload é opcional — se o bucket não existir, a análise continua com base64
        setUploading(true);
        try {
          const results = await uploadFiles([file], "analyses");
          fileUrl = results[0]?.url;
        } catch {
          // Upload falhou (bucket não configurado, etc.) — continua sem fileUrl
        } finally {
          setUploading(false);
        }

        if (file.type.startsWith("image/")) {
          // Convert image to base64
          const reader = new FileReader();
          const b64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          imageBase64Frames = [b64];
          thumbnailUrl = fileUrl;
        } else if (file.type.startsWith("video/")) {
          // Extract video frames
          try {
            const frames = await extractVideoFrames(file, 6, 0.8);
            imageBase64Frames = frames;
            thumbnailUrl = frames[0];
          } catch {
            toast.error("Não foi possível extrair frames do vídeo");
          }
        }
      }

      const token = getToken();
      const res = await fetch("/api/ai/analise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          inputType,
          inputUrl: inputUrl || undefined,
          pastedContent: pastedContent || undefined,
          platform: platform || undefined,
          fileUrl,
          thumbnailUrl,
          imageBase64Frames,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.id) {
        toast.success("Análise concluída com sucesso!");
        router.push(`/dashboard/analise/${data.data.id}`);
      } else {
        toast.error(data.error ?? "Erro ao realizar análise");
      }
    } catch (err) {
      toast.error("Erro ao realizar análise");
    } finally {
      setAnalyzing(false);
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const token = getToken();
      const res = await fetch(`/api/ai/analise/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Análise removida");
        loadHistory(historyPage, historyFilter);
      } else {
        toast.error(data.error ?? "Erro ao remover análise");
      }
    } catch {
      toast.error("Erro ao remover análise");
    } finally {
      setDeletingId(null);
    }
  }

  function resetForm() {
    setSelectedType(null);
    setInputType("image");
    setInputUrl("");
    setPastedContent("");
    setPlatform("");
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const selectedTypeConfig = ANALYSIS_TYPES.find((t) => t.id === selectedType);

  // Membership check
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [membershipOk, setMembershipOk] = useState(false);

  useEffect(() => {
    const ok = hasPlatform();
    setMembershipOk(ok);
    setMembershipChecked(true);
  }, [hasPlatform]);

  if (!membershipChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#009CD9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!membershipOk) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#EEE6E4] mb-3">IA de Análises</h1>
        <p className="text-gray-400 mb-8">
          Esta funcionalidade está disponível apenas para assinantes da plataforma Detailer&apos;HUB.
        </p>
        <button
          onClick={() => router.push("/dashboard/assinar")}
          className="btn-premium px-6 py-3 rounded-xl text-white font-semibold text-sm"
        >
          Assinar agora
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#EEE6E4]">IA de Análises</h1>
          </div>
          <p className="text-gray-400 text-sm ml-12">
            Analise criativos, perfis, posts e sites com inteligência artificial avançada.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {(["new", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-[#006079]/30 text-[#009CD9] border border-[#006079]/30"
                : "text-gray-400 hover:text-[#EEE6E4]"
            }`}
          >
            {tab === "new" ? "Nova Análise" : `Histórico${historyTotal > 0 && activeTab === "history" ? ` (${historyTotal})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── New Analysis Tab ── */}
      {activeTab === "new" && (
        <div className="space-y-6">
          {!selectedType ? (
            /* Category selection */
            <div>
              <p className="text-gray-400 text-sm mb-4">Selecione o tipo de análise:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ANALYSIS_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedType(t.id);
                      setInputType(t.supports[0]);
                    }}
                    className="glass-card p-5 text-left hover:border-[#006079]/40 hover:bg-[#006079]/5 transition-all group animate-slide-up"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-xl flex items-center justify-center mb-3`}>
                      <t.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-[#EEE6E4] font-semibold text-sm mb-1 group-hover:text-white transition-colors">
                      {t.label}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{t.description}</p>
                    <div className="mt-3 flex items-center gap-1 text-[#009CD9] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Selecionar</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Analysis form */
            <div className="space-y-5 animate-fade-in">
              {/* Back + selected type header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#EEE6E4] text-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 bg-gradient-to-br ${selectedTypeConfig?.color} rounded-lg flex items-center justify-center`}>
                    {selectedTypeConfig && <selectedTypeConfig.icon className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-[#EEE6E4] font-semibold text-sm">{selectedTypeConfig?.label}</span>
                </div>
              </div>

              <div className="glass-card p-6 space-y-5">
                {/* Input type selector */}
                {selectedTypeConfig && selectedTypeConfig.supports.length > 1 && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                      Tipo de entrada
                    </label>
                    <div className="flex gap-2">
                      {selectedTypeConfig.supports.map((it) => (
                        <button
                          key={it}
                          onClick={() => {
                            setInputType(it);
                            setFile(null);
                            setFilePreview(null);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            inputType === it
                              ? "bg-[#006079]/30 text-[#009CD9] border-[#006079]/40"
                              : "text-gray-400 border-white/10 hover:border-white/20 hover:text-[#EEE6E4]"
                          }`}
                        >
                          {it === "image" && <ImageIcon className="w-3.5 h-3.5" />}
                          {it === "video" && <Film className="w-3.5 h-3.5" />}
                          {it === "url" && <Link2 className="w-3.5 h-3.5" />}
                          {it === "image" ? "Imagem" : it === "video" ? "Vídeo" : "URL"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* File upload */}
                {(inputType === "image" || inputType === "video") && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                      {inputType === "image" ? "Imagem" : "Vídeo"} *
                    </label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-[#006079]/60 hover:bg-[#006079]/5 ${
                        file ? "border-[#006079]/40 bg-[#006079]/5" : "border-white/10"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={inputType === "image" ? "image/*" : "video/*"}
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      {file ? (
                        <div className="space-y-2">
                          {filePreview && inputType === "image" && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="max-h-40 mx-auto rounded-lg object-contain"
                            />
                          )}
                          {inputType === "video" && (
                            <Film className="w-8 h-8 text-[#009CD9] mx-auto" />
                          )}
                          <p className="text-sm text-[#EEE6E4] font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              setFilePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                          >
                            Remover arquivo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                          <p className="text-sm text-gray-400">
                            Clique ou arraste {inputType === "image" ? "uma imagem" : "um vídeo"} aqui
                          </p>
                          <p className="text-xs text-gray-600">
                            {inputType === "image" ? "JPG, PNG, WEBP, GIF" : "MP4, MOV, AVI, WEBM"} — até 200MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* URL input */}
                {inputType === "url" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                      URL {selectedType === "SITE_ANALYSIS" ? "*" : "(opcional)"}
                    </label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#006079]/60">
                      <Link2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-[#EEE6E4] placeholder-gray-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Pasted content — visível para todos os tipos */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    {selectedType === "PROFILE_AUDIT"
                      ? "Cole a bio / informações do perfil"
                      : selectedType === "SITE_ANALYSIS"
                      ? "Cole textos da página"
                      : "Contexto adicional"}{" "}
                    <span className="normal-case text-gray-600">
                      {selectedType === "PROFILE_AUDIT" || selectedType === "SITE_ANALYSIS"
                        ? "(recomendado para análise mais precisa)"
                        : "(opcional)"}
                    </span>
                  </label>
                  <textarea
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder={
                      selectedType === "AD_CREATIVE"
                        ? "Descreva o objetivo do anúncio, público-alvo, produto anunciado..."
                        : selectedType === "PROFILE_AUDIT"
                        ? "Cole aqui o texto da bio, número de seguidores, nicho, destaques, tipo de conteúdo que publica... Quanto mais informação, mais precisa a análise."
                        : selectedType === "SITE_ANALYSIS"
                        ? "Cole aqui a headline, textos principais, CTAs, proposta de valor, depoimentos... O modelo não consegue navegar no site — cole o conteúdo para análise precisa."
                        : "Cole a legenda do post, hashtags, dados de engajamento..."
                    }
                    rows={selectedType === "PROFILE_AUDIT" || selectedType === "SITE_ANALYSIS" ? 6 : 4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#EEE6E4] placeholder-gray-500 outline-none focus:border-[#006079]/60 resize-none"
                  />
                  {(selectedType === "PROFILE_AUDIT" || selectedType === "SITE_ANALYSIS") && (
                    <p className="text-xs text-gray-600 mt-1.5">
                      💡 A IA busca o conteúdo da URL automaticamente, mas colar informações adicionais melhora muito a precisão.
                    </p>
                  )}
                </div>

                {/* Platform selector */}
                {selectedType !== "SITE_ANALYSIS" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                      Plataforma{" "}
                      <span className="normal-case text-gray-600">(opcional)</span>
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#EEE6E4] outline-none focus:border-[#006079]/60 appearance-none"
                    >
                      {PLATFORM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#252525]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={analyzing}
                  className="w-full btn-premium py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploading ? "Enviando arquivo..." : "Analisando com IA..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analisar agora
                    </>
                  )}
                </button>

                {analyzing && (
                  <p className="text-xs text-gray-500 text-center">
                    A análise pode levar até 30 segundos dependendo do conteúdo.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#006079]/60">
              <Search className="w-4 h-4 text-gray-500" />
              <select
                value={historyFilter}
                onChange={(e) => {
                  setHistoryFilter(e.target.value as AIAnalysisType | "");
                  setHistoryPage(1);
                }}
                className="bg-transparent text-sm text-[#EEE6E4] outline-none"
              >
                <option value="" className="bg-[#252525]">Todos os tipos</option>
                {ANALYSIS_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#252525]">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => loadHistory(historyPage, historyFilter)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#EEE6E4] bg-white/5 border border-white/10 rounded-xl px-3 py-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                      <div className="h-2.5 bg-white/10 rounded w-1/2" />
                    </div>
                    <div className="w-12 h-6 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : analyses.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium mb-1">Nenhuma análise encontrada</p>
              <p className="text-gray-600 text-sm">
                Crie sua primeira análise na aba &quot;Nova Análise&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((a) => {
                const typeConfig = ANALYSIS_TYPES.find((t) => t.id === a.type);
                const StatusIcon = STATUS_ICONS[a.status] ?? Clock;
                return (
                  <div
                    key={a.id}
                    className="glass-card p-4 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${typeConfig?.color ?? "from-[#006079] to-[#009CD9]"} rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        {typeConfig ? (
                          <typeConfig.icon className="w-5 h-5 text-white" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm text-[#EEE6E4] font-medium">
                            {typeConfig?.label ?? TYPE_LABELS[a.type]}
                          </span>
                          {a.platform && (
                            <span className="text-xs text-gray-500 capitalize">{a.platform}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <StatusIcon
                            className={`w-3.5 h-3.5 ${STATUS_COLORS[a.status] ?? "text-gray-400"}`}
                          />
                          <span className={STATUS_COLORS[a.status] ?? "text-gray-400"}>
                            {a.status === "COMPLETED"
                              ? "Concluída"
                              : a.status === "FAILED"
                              ? "Falhou"
                              : "Pendente"}
                          </span>
                          {a.score !== null && a.status === "COMPLETED" && (
                            <>
                              <span className="text-gray-700">•</span>
                              <span className="text-gray-400">Score: {a.score}/100</span>
                            </>
                          )}
                          <span className="text-gray-700">•</span>
                          <span>
                            {new Date(a.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.status === "COMPLETED" && (
                          <button
                            onClick={() => router.push(`/dashboard/analise/${a.id}`)}
                            className="flex items-center gap-1.5 text-xs text-[#009CD9] hover:text-white bg-[#006079]/20 hover:bg-[#006079]/40 border border-[#006079]/30 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Ver resultado
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          {deletingId === a.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">
                    {historyTotal} análise{historyTotal !== 1 ? "s" : ""} no total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage((p) => p - 1)}
                      className="p-1.5 text-gray-400 hover:text-[#EEE6E4] bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400">
                      {historyPage} / {historyTotalPages}
                    </span>
                    <button
                      disabled={historyPage >= historyTotalPages}
                      onClick={() => setHistoryPage((p) => p + 1)}
                      className="p-1.5 text-gray-400 hover:text-[#EEE6E4] bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
