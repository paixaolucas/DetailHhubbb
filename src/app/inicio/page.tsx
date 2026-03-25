"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";
import { useViewAs } from "@/contexts/view-as-context";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";
import { PartnerDashboard } from "@/components/dashboard/PartnerDashboard";

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-white/10 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-7 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InicioPage() {
  const [actualRole, setActualRole] = useState<string | null>(null);
  const [actualName, setActualName] = useState("");
  const [actualUserId, setActualUserId] = useState("");
  const router = useRouter();
  const { viewAs, effectiveRole, effectiveName } = useViewAs();

  useEffect(() => {
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (!storedRole) { router.replace("/login"); return; }

    // Admins e influencers vão para /dashboard
    if (storedRole === "SUPER_ADMIN" || storedRole === "INFLUENCER_ADMIN") {
      router.replace("/dashboard");
      return;
    }

    setActualRole(storedRole);
    setActualName(localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "");
    setActualUserId(localStorage.getItem(STORAGE_KEYS.USER_ID) ?? "");
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

  const forcePaid =
    effectiveRole === "COMMUNITY_MEMBER" && effectiveRole !== actualRole
      ? viewAs === "MEMBER_UNPAID" ? false : true
      : undefined;

  if (role === "MARKETPLACE_PARTNER") {
    return <PartnerDashboard userName={userName} />;
  }

  return (
    <Suspense fallback={<Skeleton />}>
      <MemberDashboard userName={userName} userId={actualUserId} forcePaid={forcePaid} />
    </Suspense>
  );
}
