"use client";

// =============================================================================
// SELL BUTTON — Only visible to INFLUENCER_ADMIN, MARKETPLACE_PARTNER, SUPER_ADMIN
// Reads role from localStorage to avoid exposing seller UI to regular members
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function SellButton() {
  const [isSeller, setIsSeller] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("detailhub_user_role");
    setIsSeller(
      role === "INFLUENCER_ADMIN" ||
        role === "MARKETPLACE_PARTNER" ||
        role === "SUPER_ADMIN"
    );
    setMounted(true);
  }, []);

  if (!mounted || !isSeller) return null;

  return (
    <Link
      href="/dashboard/meus-produtos"
      className="flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#007A99] hover:from-[#007A99] hover:to-[#007A99] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
    >
      <ShoppingBag className="w-4 h-4" />
      Vender produto
    </Link>
  );
}
