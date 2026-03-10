import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-violet-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Página não encontrada</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi removida.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Ir para o início
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-sm font-semibold transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
