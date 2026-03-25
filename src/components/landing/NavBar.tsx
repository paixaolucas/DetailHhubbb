"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, ChevronDown, LogOut } from "lucide-react";
import { LogoType } from "@/components/ui/logo";
import { STORAGE_KEYS } from "@/lib/constants";

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

function useNavAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (token && name) {
      setUser({ name, email: email ?? "", role: role ?? "" });
    }
  }, []);

  function logout() {
    [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER_ROLE,
     STORAGE_KEYS.USER_NAME, STORAGE_KEYS.USER_EMAIL, STORAGE_KEYS.USER_ID].forEach(
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
    <nav className="border-b border-white/10 backdrop-blur-md bg-[#1A1A1A]/90 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <LogoType height={28} variant="light" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#comunidades" className="text-gray-500 hover:text-[#EEE6E4] text-sm transition-colors">
            Comunidades
          </a>
          <a href="#features" className="text-gray-500 hover:text-[#EEE6E4] text-sm transition-colors">
            Features
          </a>
          <a href="#como-funciona" className="text-gray-500 hover:text-[#EEE6E4] text-sm transition-colors">
            Como funciona
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            /* ── Logged in ── */
            <>
              <Link
                href="/inicio"
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#009CD9]/50 rounded-xl px-3 py-1.5 transition-all"
                >
                  <div className="w-7 h-7 bg-[#007A99] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-300 max-w-[120px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#222222] border border-white/10 rounded-2xl shadow-lg z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-[#EEE6E4] truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/inicio"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Ir para o dashboard
                        </Link>
                        <Link
                          href="/communities"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Ver comunidades
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
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
                className="text-gray-400 hover:text-[#EEE6E4] text-sm transition-colors hidden sm:block"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-[#006079] hover:bg-[#007A99] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
              >
                Começar grátis
              </Link>
            </>
          )}

          {/* Hamburger button — mobile only */}
          <button
            className="md:hidden text-gray-500 hover:text-[#EEE6E4] transition-colors p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1A1A1A]/95 backdrop-blur-md px-4 py-4 space-y-1">
          <a
            href="#comunidades"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-400 hover:text-[#EEE6E4] py-2.5 text-sm border-b border-white/10"
          >
            Comunidades
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-400 hover:text-[#EEE6E4] py-2.5 text-sm border-b border-white/10"
          >
            Features
          </a>
          <a
            href="#como-funciona"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-400 hover:text-[#EEE6E4] py-2.5 text-sm border-b border-white/10"
          >
            Como funciona
          </a>
          <div className="pt-2">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 py-2.5 border-b border-white/10 mb-2">
                  <div className="w-8 h-8 bg-[#007A99] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEE6E4]">{user.name.split(" ")[0]}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/inicio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#EEE6E4] py-2.5 text-sm mb-1"
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
                  className="block text-center text-gray-400 hover:text-[#EEE6E4] py-2.5 text-sm mb-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-[#006079] hover:bg-[#007A99] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
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
