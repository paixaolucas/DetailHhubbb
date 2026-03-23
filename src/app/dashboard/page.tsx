"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";
import { useViewAs } from "@/contexts/view-as-context";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { InfluencerDashboard } from "@/components/dashboard/InfluencerDashboard";
import { PartnerDashboard } from "@/components/dashboard/PartnerDashboard";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-white/10 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-white/10 rounded w-24" />
              <div className="w-10 h-10 bg-white/10 rounded-xl" />
            </div>
            <div className="h-7 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="h-4 bg-white/10 rounded w-40" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/10 rounded" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          <div className="h-4 bg-white/10 rounded w-28" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [actualRole, setActualRole] = useState<string | null>(null);
  const [actualName, setActualName] = useState("");
  const [actualUserId, setActualUserId] = useState("");
  const router = useRouter();
  const { viewAs, effectiveRole, effectiveName } = useViewAs();

  useEffect(() => {
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (!storedRole) {
      router.replace("/login");
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

  // ViewAs: force membership state when admin simulates member
  const forcePaid =
    effectiveRole === "COMMUNITY_MEMBER" && effectiveRole !== actualRole
      ? viewAs === "MEMBER_UNPAID" ? false : true
      : undefined;

  switch (role) {
    case "SUPER_ADMIN":
      return <AdminDashboard />;

    case "INFLUENCER_ADMIN":
      return <InfluencerDashboard userName={userName} />;

    case "COMMUNITY_MEMBER":
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <MemberDashboard
            userName={userName}
            userId={actualUserId}
            forcePaid={forcePaid}
          />
        </Suspense>
      );

    case "MARKETPLACE_PARTNER":
      return <PartnerDashboard userName={userName} />;

    default:
      if (actualRole === "SUPER_ADMIN") return <AdminDashboard />;
      router.replace("/login");
      return null;
  }
}
