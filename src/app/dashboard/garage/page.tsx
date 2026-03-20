"use client";

// =============================================================================
// Minha Garagem — member can document their car and share to the feed
// Reads/writes carBrand, carModel, carYear via PATCH /api/users/[id]/profile
// Photos stored in UserProfile.metadata.carPhotos via same endpoint
// =============================================================================

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Car, Save, ImageIcon, X, Share2 } from "lucide-react";
import { uploadFiles } from "@/utils/upload";
import { STORAGE_KEYS } from "@/lib/constants";

interface GarageData {
  carBrand: string;
  carModel: string;
  carYear: string;
  carColor: string;
  carPower: string;
  carFuel: string;
  carPhotos: string[];
}

export default function GaragePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<GarageData>({
    carBrand: "",
    carModel: "",
    carYear: "",
    carColor: "",
    carPower: "",
    carFuel: "",
    carPhotos: [],
  });

  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    setUserId(uid);

    if (!uid || !token) {
      setLoading(false);
      return;
    }

    fetch(`/api/users/${uid}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const p = json.data;
          const meta = p.metadata ?? {};
          setForm({
            carBrand: p.carBrand ?? "",
            carModel: p.carModel ?? "",
            carYear: p.carYear ? String(p.carYear) : "",
            carColor: meta.carColor ?? "",
            carPower: meta.carPower ?? "",
            carFuel: meta.carFuel ?? "",
            carPhotos: meta.carPhotos ?? [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...selectedFiles, ...files].slice(0, 10 - form.carPhotos.length);
    setSelectedFiles(combined);
    setPreviewUrls(combined.map((f) => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeExistingPhoto(idx: number) {
    setForm((prev) => ({
      ...prev,
      carPhotos: prev.carPhotos.filter((_, i) => i !== idx),
    }));
  }

  function removeNewPhoto(idx: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      let newPhotoUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setUploading(true);
        try {
          const uploaded = await uploadFiles(selectedFiles, "posts");
          newPhotoUrls = uploaded.map((f) => f.url);
        } catch {
          setError("Erro ao fazer upload das fotos.");
          return;
        } finally {
          setUploading(false);
        }
      }

      const allPhotos = [...form.carPhotos, ...newPhotoUrls];

      const res = await fetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          carBrand: form.carBrand || undefined,
          carModel: form.carModel || undefined,
          carYear: form.carYear ? parseInt(form.carYear) : undefined,
          carColor: form.carColor || undefined,
          carPower: form.carPower || undefined,
          carFuel: form.carFuel || undefined,
          carPhotos: allPhotos,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setForm((prev) => ({ ...prev, carPhotos: allPhotos }));
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSuccess("Garagem salva com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.error ?? "Erro ao salvar.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm";

  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-8 bg-white/5 rounded w-48" />
        <div className="glass-card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasCar = form.carBrand || form.carModel;
  const busy = saving || uploading;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#007A99]/15 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-[#009CD9]" />
          </div>
          Minha Garagem
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Documente seu carro e compartilhe com a comunidade.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Car info form */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#EEE6E4]">Dados do Veículo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Marca</label>
            <input
              type="text"
              value={form.carBrand}
              onChange={(e) => setForm((p) => ({ ...p, carBrand: e.target.value }))}
              placeholder="Toyota, BMW, Ford..."
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Modelo</label>
            <input
              type="text"
              value={form.carModel}
              onChange={(e) => setForm((p) => ({ ...p, carModel: e.target.value }))}
              placeholder="Supra, M3, Mustang..."
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Ano</label>
            <input
              type="number"
              value={form.carYear}
              onChange={(e) => setForm((p) => ({ ...p, carYear: e.target.value }))}
              placeholder="2020"
              min="1900"
              max="2030"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Cor</label>
            <input
              type="text"
              value={form.carColor}
              onChange={(e) => setForm((p) => ({ ...p, carColor: e.target.value }))}
              placeholder="Preto, Vermelho..."
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Potência (cv)</label>
            <input
              type="text"
              value={form.carPower}
              onChange={(e) => setForm((p) => ({ ...p, carPower: e.target.value }))}
              placeholder="320 cv"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Combustível</label>
            <select
              value={form.carFuel}
              onChange={(e) => setForm((p) => ({ ...p, carFuel: e.target.value }))}
              className={fieldClass}
            >
              <option value="">Selecione...</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Etanol">Etanol</option>
              <option value="Flex">Flex</option>
              <option value="Diesel">Diesel</option>
              <option value="Elétrico">Elétrico</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#EEE6E4]">Fotos do Carro</h2>

        {/* Existing photos */}
        {form.carPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {form.carPhotos.map((url, i) => (
              <div key={i} className="relative group">
                <Image
                  src={url}
                  alt=""
                  width={200}
                  height={112}
                  className="w-full h-28 object-cover rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-[#EEE6E4]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New photo previews */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative group">
                <Image
                  src={url}
                  alt=""
                  width={200}
                  height={112}
                  className="w-full h-28 object-cover rounded-xl border border-[#007A99]/30 opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-[#009CD9] bg-[#1A1A1A]/80 rounded-lg px-2 py-0.5">Pendente</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-[#EEE6E4]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {form.carPhotos.length + selectedFiles.length < 10 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#009CD9] transition-colors border border-dashed border-white/10 hover:border-[#007A99]/30 rounded-xl px-4 py-3 w-full justify-center"
          >
            <ImageIcon className="w-4 h-4" />
            Adicionar fotos ({form.carPhotos.length + selectedFiles.length}/10)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          {busy ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {uploading ? "Enviando fotos..." : "Salvando..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar garagem
            </>
          )}
        </button>

        {hasCar && (
          <a
            href="/dashboard/minhas-comunidades"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 border border-white/10 hover:border-[#99D3DF] px-5 py-2.5 rounded-xl transition-all"
          >
            <Share2 className="w-4 h-4" />
            Ir para feed e compartilhar
          </a>
        )}
      </div>
    </div>
  );
}
