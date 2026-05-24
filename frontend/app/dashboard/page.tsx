"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface UserProfile {
  id: string; email: string; firstName: string; lastName: string;
  major?: string | null; gradYear?: number | null;
  university?: { id: string; name: string; domain: string } | null;
  stats: { projects: number; listings: number; activeRooms: number; pendingTasks: number };
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/me").then(setProfile).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() || "Student" : "Student";
  const initials = profile?.firstName?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "S";
  const stats = profile?.stats || { projects: 0, listings: 0, activeRooms: 0, pendingTasks: 0 };

  const quickLinks = [
    { href: "/dashboard/projects", icon: "◐", title: "My Projects", desc: "Manage group projects and tasks", gradient: "from-indigo-500 to-blue-500", bg: "from-indigo-50 to-blue-50", border: "border-indigo-100" },
    { href: "/dashboard/marketplace", icon: "◑", title: "Marketplace", desc: "Buy and sell textbooks & notes", gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", border: "border-purple-100" },
    { href: "/dashboard/study-rooms", icon: "◒", title: "Study Rooms", desc: "Virtual co-studying sessions", gradient: "from-amber-500 to-orange-500", bg: "from-amber-50 to-orange-50", border: "border-amber-100" },
  ];

  const statCards = [
    { label: "Projects", value: stats.projects, icon: "◐", bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Listings", value: stats.listings, icon: "◑", bg: "bg-purple-50", text: "text-purple-600" },
    { label: "Active Rooms", value: stats.activeRooms, icon: "◒", bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Pending Tasks", value: stats.pendingTasks, icon: "◓", bg: "bg-emerald-50", text: "text-emerald-600" },
  ];

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/profile">
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm ring-2 ring-white transition-transform hover:scale-105">
                {initials}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-400">Quick access</h2>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((card, i) => (
            <Link key={card.href} href={card.href} className={`group card relative overflow-hidden ${card.border} animate-fade-in`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-50`} />
              <div className="relative p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-xl text-white shadow-sm`}>{card.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="card-static p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} text-lg ${s.text}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {profile?.university && (
          <div className="mt-6 card-static p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">🎓</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{profile.university.name}</p>
                <p className="text-xs text-gray-400">{profile.major || "No major set"} · Class of {profile.gradYear || "—"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
