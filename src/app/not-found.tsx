import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-blue-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Página não encontrada</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi removida.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Ir para o início
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
