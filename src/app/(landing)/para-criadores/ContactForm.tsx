"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface FormState {
  nome: string;
  instagram: string;
  seguidores: string;
  mensagem: string;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    nome: "",
    instagram: "",
    seguidores: "",
    mensagem: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="glass-card p-10 flex flex-col items-center justify-center gap-4 text-center min-h-[280px]">
        <div className="w-16 h-16 bg-[#006079]/20 border border-[#009CD9]/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#009CD9]" />
        </div>
        <h3 className="text-xl font-bold text-[#EEE6E4]">Recebemos!</h3>
        <p className="text-gray-400 max-w-sm">
          Entraremos em contato em até 48h para conversar sobre os próximos passos. Bora construir isso juntos.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white/5 border border-white/10 text-[#EEE6E4] placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#009CD9]/50 focus:ring-1 focus:ring-[#009CD9]/20 transition-all";

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nome" className="block text-xs text-gray-400 mb-1.5 font-medium">
            Nome <span className="text-[#009CD9]">*</span>
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Seu nome completo"
            value={form.nome}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="instagram" className="block text-xs text-gray-400 mb-1.5 font-medium">
            @Instagram ou canal principal <span className="text-[#009CD9]">*</span>
          </label>
          <input
            id="instagram"
            name="instagram"
            type="text"
            required
            placeholder="@seucanal"
            value={form.instagram}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="seguidores" className="block text-xs text-gray-400 mb-1.5 font-medium">
          Número aproximado de seguidores <span className="text-[#009CD9]">*</span>
        </label>
        <select
          id="seguidores"
          name="seguidores"
          required
          value={form.seguidores}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="" disabled>Selecione uma faixa</option>
          <option value="1k-10k">1.000 – 10.000</option>
          <option value="10k-50k">10.000 – 50.000</option>
          <option value="50k-200k">50.000 – 200.000</option>
          <option value="200k-500k">200.000 – 500.000</option>
          <option value="500k+">Mais de 500.000</option>
        </select>
      </div>

      <div>
        <label htmlFor="mensagem" className="block text-xs text-gray-400 mb-1.5 font-medium">
          Mensagem <span className="text-gray-600">(opcional)</span>
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={4}
          placeholder="Conte um pouco sobre você, seu nicho e o que te interessa na plataforma..."
          value={form.mensagem}
          onChange={handleChange}
          className={`${inputCls} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#006079]/30 active:scale-[0.98]"
      >
        Enviar
      </button>
    </form>
  );
}
