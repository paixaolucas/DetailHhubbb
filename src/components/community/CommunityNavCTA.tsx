"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STORAGE_KEYS } from "@/lib/constants";

interface Props {
  communitySlug: string;
  primaryColor: string;
}

export function CommunityNavCTA({ communitySlug, primaryColor }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
  }, []);

  if (isLoggedIn) {
    return (
      <Link
        href={`/community/${communitySlug}/feed`}
        className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
        style={{ backgroundColor: primaryColor }}
      >
        Ir para o feed
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors hidden sm:block"
      >
        Entrar
      </Link>
      <Link
        href="/register"
        className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
        style={{ backgroundColor: primaryColor }}
      >
        Fazer parte
      </Link>
    </div>
  );
}
