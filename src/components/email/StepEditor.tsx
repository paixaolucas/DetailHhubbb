"use client";

import { Trash2 } from "lucide-react";

export interface EmailStep {
  stepNumber: number;
  delayDays: number;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

interface StepEditorProps {
  step: EmailStep;
  index: number;
  onChange: (step: EmailStep) => void;
  onRemove: () => void;
}

function inputClass() {
  return "w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm";
}

export default function StepEditor({ step, index, onChange, onRemove }: StepEditorProps) {
  const update = (field: keyof EmailStep, value: string | number) =>
    onChange({ ...step, [field]: value });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          Passo {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 rounded-lg transition-colors"
          aria-label="Remover passo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delay */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Enviar após X dias
        </label>
        <input
          type="number"
          min={0}
          value={step.delayDays}
          onChange={(e) => update("delayDays", Math.max(0, parseInt(e.target.value, 10) || 0))}
          className={`${inputClass()} w-32`}
          placeholder="0"
        />
        <p className="text-xs text-gray-600 mt-1">
          {step.delayDays === 0
            ? "Envio imediato após o gatilho"
            : `Enviado ${step.delayDays} dia${step.delayDays === 1 ? "" : "s"} após o gatilho`}
        </p>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Assunto
        </label>
        <input
          type="text"
          value={step.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder="Assunto do email..."
          className={inputClass()}
        />
      </div>

      {/* Body HTML */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Corpo do email{" "}
          <span className="text-gray-600">(HTML suportado: &lt;p&gt;, &lt;b&gt;, &lt;a&gt;, &lt;br&gt;)</span>
        </label>
        <textarea
          value={step.bodyHtml}
          onChange={(e) => update("bodyHtml", e.target.value)}
          placeholder="<p>Olá {{firstName}},</p><p>Seja bem-vindo(a)!</p>"
          rows={6}
          className={`${inputClass()} resize-y font-mono text-xs leading-relaxed`}
        />
      </div>
    </div>
  );
}
