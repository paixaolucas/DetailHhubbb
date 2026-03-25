"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";
import { useViewAs } from "@/contexts/view-as-context";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { InfluencerDashboard } from "@/components/dashboard/InfluencerDashboard";

export default function DashboardPage() {
  const [actualRole, setActualRole] = useState<string | null>(null);
  const [actualName, setActualName] = useState("");
  const router = useRouter();
  const { effectiveRole, effectiveName } = useViewAs();

  useEffect(() => {
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (!storedRole) {
      router.replace("/login");
      return;
    }
    setActualRole(storedRole);
    setActualName(localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "");
  }, [router]);

  if (!actualRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-[#007A99] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = effectiveRole || actualRole;
  const userName = effectiveName || actualName;

  switch (role) {
    case "SUPER_ADMIN":
      return <AdminDashboard />;

    case "INFLUENCER_ADMIN":
      return <InfluencerDashboard userName={userName} />;

    case "COMMUNITY_MEMBER":
    case "MARKETPLACE_PARTNER":
      // Membros têm página própria em /inicio
      router.replace("/inicio");
      return null;

    default:
      if (actualRole === "SUPER_ADMIN") return <AdminDashboard />;
      router.replace("/login");
      return null;
  }
}
