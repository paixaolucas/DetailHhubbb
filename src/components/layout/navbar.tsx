"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, ChevronDown, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

function useNavAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    const name = localStorage.getItem("detailhub_user_name");
    const email = localStorage.getItem("detailhub_user_email");
    const role = localStorage.getItem("detailhub_user_role");
    if (token && name) {
      setUser({ name, email: email ?? "", role: role ?? "" });
    }
  }, []);

  function logout() {
    ["detailhub_access_token", "detailhub_refresh_token", "detailhub_user_role",
     "detailhub_user_name", "detailhub_user_email", "detailhub_user_id"].forEach(
      (k) => localStorage.removeItem(k)
    );
    setUser(null);
    window.location.href = "/";
  }

  return { user, logout };
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useNavAuth();

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

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            /* ── Logged in ── */
            <>
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-200 hover:border-violet-300 rounded-xl px-3 py-1.5 transition-all"
                >
                  <div className="w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Ir para o dashboard
                        </Link>
                        <Link
                          href="/communities"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Ver comunidades
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* ── Not logged in ── */
            <>
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
            </>
          )}

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
            {user ? (
              <>
                <div className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 mb-2">
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name.split(" ")[0]}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 py-2.5 text-sm mb-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Ir para o dashboard
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 text-red-500 py-2.5 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
