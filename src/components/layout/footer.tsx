import Link from "next/link";
import { Github, Twitter, Instagram, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {/* CTA Banner */}
      <div className="bg-[#111827] py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">
            Pronto para entrar na maior plataforma automotiva do Brasil?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Junte-se a milhares de entusiastas e criadores. Acesse tudo por R$837/ano.
          </p>
          <Link
            href="/register"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[#0F172A] border-t border-white/10">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo size="md" />
                <span className="text-white font-bold text-lg">DetailHub</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                A plataforma premium para comunidades automotivas. Conecte-se com
                os melhores entusiastas do Brasil.
              </p>
              <div className="flex items-center gap-3 mt-6">
                {[
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Instagram, href: "#", label: "Instagram" },
                  { icon: Youtube, href: "#", label: "YouTube" },
                  { icon: Github, href: "#", label: "GitHub" },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Plataforma</h3>
              <ul className="space-y-3">
                {[
                  { label: "Comunidades", href: "/communities" },
                  { label: "Marketplace", href: "/dashboard/marketplace" },
                  { label: "Lives", href: "/dashboard/lives" },
                  { label: "IA Mecânica", href: "/dashboard/ai" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Para Criadores */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Para Criadores</h3>
              <ul className="space-y-3">
                {[
                  { label: "Monetização", href: "/register" },
                  { label: "Analytics", href: "/dashboard/analytics" },
                  { label: "Ferramentas", href: "/dashboard/tools" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Empresa</h3>
              <ul className="space-y-3">
                {[
                  { label: "Sobre nós", href: "/sobre" },
                  { label: "Blog", href: "/blog" },
                  { label: "Carreiras", href: "/carreiras" },
                  { label: "Contato", href: "/contato" },
                  { label: "Privacidade", href: "/privacidade" },
                  { label: "Termos", href: "/termos" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} DetailHub. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-gray-400 text-sm">Sistema operacional</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">·</span>
              <div className="hidden sm:flex items-center gap-3 text-sm text-gray-400">
                <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
                <span className="text-gray-600">·</span>
                <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
