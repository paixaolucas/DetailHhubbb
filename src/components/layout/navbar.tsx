"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 backdrop-blur-md bg-[#F8F7FF]/90 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
          <Logo size="md" />
          <span className="text-gray-900">DetailHub</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#comunidades" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
            Comunidades
          </a>
          <a href="#features" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
            Features
          </a>
          <a href="#como-funciona" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
            Como funciona
          </a>
        </div>

        {/* Desktop CTAs + hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors hidden sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
          >
            Começar grátis
          </Link>
          {/* Hamburger button — mobile only */}
          <button
            className="md:hidden text-gray-500 hover:text-gray-900 transition-colors p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-[#F0EEFF]/95 backdrop-blur-md px-4 py-4 space-y-1">
          <a
            href="#comunidades"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-600 hover:text-gray-900 py-2.5 text-sm border-b border-gray-100"
          >
            Comunidades
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-600 hover:text-gray-900 py-2.5 text-sm border-b border-gray-100"
          >
            Features
          </a>
          <a
            href="#como-funciona"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-600 hover:text-gray-900 py-2.5 text-sm border-b border-gray-100"
          >
            Como funciona
          </a>
          <div className="pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center text-gray-600 hover:text-gray-900 py-2.5 text-sm mb-2"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
