"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-red-500 mb-4">!</div>
        <h1 className="text-2xl font-bold text-white mb-3">Algo deu errado</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}
