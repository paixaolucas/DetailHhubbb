"use client";

import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import StepEditor, { EmailStep } from "./StepEditor";

type TriggerType = "ON_JOIN" | "ON_SUBSCRIPTION" | "ON_LESSON_COMPLETE" | "MANUAL";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  ON_JOIN: "Ao entrar",
  ON_SUBSCRIPTION: "Ao assinar",
  ON_LESSON_COMPLETE: "Ao completar aula",
  MANUAL: "Manual",
};

export interface EmailSequence {
  id: string;
  name: string;
  trigger: TriggerType;
  isActive: boolean;
  steps?: EmailStep[];
}

interface SequenceEditorProps {
  communityId: string;
  sequence?: EmailSequence;
  onSave: () => void;
  onCancel: () => void;
}

function inputClass() {
  return "w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm";
}

export default function SequenceEditor({
  communityId,
  sequence,
  onSave,
  onCancel,
}: SequenceEditorProps) {
  const isEdit = !!sequence;
  const [name, setName] = useState(sequence?.name ?? "");
  const [trigger, setTrigger] = useState<TriggerType>(sequence?.trigger ?? "ON_JOIN");
  const [isActive, setIsActive] = useState(sequence?.isActive ?? true);
  const [steps, setSteps] = useState<EmailStep[]>(sequence?.steps ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        delayDays: prev.length === 0 ? 0 : 1,
        subject: "",
        bodyHtml: "",
      },
    ]);
  };

  const updateStep = (index: number, updated: EmailStep) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...updated, stepNumber: index + 1 };
      return next;
    });
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) {
      setError("O nome da sequência é obrigatório.");
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res: Response;
      if (isEdit && sequence) {
        res = await fetch(
          `/api/communities/${communityId}/email-sequences/${sequence.id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ name, trigger, isActive, steps }),
          }
        );
      } else {
        res = await fetch(`/api/communities/${communityId}/email-sequences`, {
          method: "POST",
          headers,
          body: JSON.stringify({ name, trigger, isActive }),
        });
        // If created and steps exist, update with steps
        if (res.ok && steps.length > 0) {
          const json = await res.json();
          await fetch(
            `/api/communities/${communityId}/email-sequences/${json.data.id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ steps }),
            }
          );
        }
      }

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Erro ao salvar sequência.");
        return;
      }

      onSave();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#EEE6E4]">
          {isEdit ? "Editar Sequência" : "Nova Sequência"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-[#EEE6E4]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Nome da sequência</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Boas-vindas ao novo membro"
          className={inputClass()}
        />
      </div>

      {/* Trigger */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Gatilho</label>
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as TriggerType)}
          className={`${inputClass()} cursor-pointer`}
        >
          {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((key) => (
            <option key={key} value={key} className="bg-gray-900 text-[#EEE6E4]">
              {TRIGGER_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isActive ? "bg-[#007A99]" : "bg-white/5"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-gray-400">
          {isActive ? "Sequência ativa" : "Sequência inativa"}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Passos ({steps.length})
          </label>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#009CD9] hover:text-[#33A7BF] bg-[#007A99]/10 hover:bg-[#007A99]/20 border border-[#007A99]/20 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Passo
          </button>
        </div>

        {steps.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-white/10 rounded-xl">
            Nenhum passo adicionado ainda. Clique em &quot;Adicionar Passo&quot; para começar.
          </p>
        )}

        {steps.map((step, i) => (
          <StepEditor
            key={i}
            step={step}
            index={i}
            onChange={(updated) => updateStep(i, updated)}
            onRemove={() => removeStep(i)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#007A99] hover:bg-[#006079] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-[2px] border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Salvando..." : "Salvar Sequência"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
