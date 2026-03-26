"use client";

import { useState } from "react";

const REF_TABLE = [
  { members: 500,  direct: 13825, pool: 2666,  total: 16491 },
  { members: 1000, direct: 27650, pool: 5333,  total: 32983 },
  { members: 2000, direct: 55300, pool: 10666, total: 65966 },
];

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function GainsSimulator() {
  const [members, setMembers] = useState(300);

  const direct = Math.round(members * 79 * 0.35);
  const pool   = Math.round(8000 * (members / 1500));
  const total  = direct + pool;

  return (
    <div className="space-y-8">
      {/* Slider */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Membros que você trouxe</span>
          <span className="text-2xl font-bold text-[#009CD9]">{members.toLocaleString("pt-BR")}</span>
        </div>

        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={members}
          onChange={(e) => setMembers(Number(e.target.value))}
          aria-label="Número de membros"
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#009CD9] bg-white/10"
        />

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>100</span>
          <span>2.000</span>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Comissão direta</p>
            <p className="text-xl font-bold text-[#EEE6E4]">{fmt(direct)}</p>
            <p className="text-xs text-gray-500 mt-1">35% × mensalidade</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Caixa de performance</p>
            <p className="text-xl font-bold text-[#EEE6E4]">{fmt(pool)}</p>
            <p className="text-xs text-gray-500 mt-1">estimativa proporcional</p>
          </div>
          <div className="bg-gradient-to-br from-[#006079]/30 to-[#009CD9]/10 border border-[#009CD9]/30 rounded-xl p-4 text-center">
            <p className="text-xs text-[#009CD9] mb-1 uppercase tracking-wider font-semibold">Total / mês</p>
            <p className="text-2xl font-bold text-[#EEE6E4]">{fmt(total)}</p>
            <p className="text-xs text-gray-500 mt-1">estimado</p>
          </div>
        </div>
      </div>

      {/* Reference table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium pb-3 pr-4">Membros</th>
              <th className="text-right text-gray-400 font-medium pb-3 px-4">Comissão direta</th>
              <th className="text-right text-gray-400 font-medium pb-3 px-4">Caixa est.</th>
              <th className="text-right text-gray-400 font-medium pb-3 pl-4">Total/mês</th>
            </tr>
          </thead>
          <tbody>
            {REF_TABLE.map((row) => (
              <tr key={row.members} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4 font-semibold text-[#EEE6E4]">{row.members.toLocaleString("pt-BR")}</td>
                <td className="py-3 px-4 text-right text-gray-300">{fmt(row.direct)}</td>
                <td className="py-3 px-4 text-right text-gray-300">{fmt(row.pool)}</td>
                <td className="py-3 pl-4 text-right font-bold text-[#009CD9]">{fmt(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-3">
          * Caixa de performance estimada com base em pool de R$8.000/mês e engajamento proporcional ao número de membros.
          Valores reais variam conforme engajamento e retenção.
        </p>
      </div>
    </div>
  );
}
