"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/dashboard/projects", label: "Projects", icon: "◐" },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: "◑" },
  { href: "/dashboard/study-rooms", label: "Study Rooms", icon: "◒" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    api.get("/users/me").then(setProfile).catch(() => {});
  }, []);

  const initials = profile
    ? (profile.firstName?.charAt(0)?.toUpperCase() || profile.email?.charAt(0).toUpperCase() || "?")
    : "?";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
          S
        </div>
        <span className="text-lg font-bold text-gray-900">ScholarSpace</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-gray-100 px-3 py-3">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
              {profile?.firstName || "User"}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">
              {profile?.email || ""}
            </p>
          </div>
          <span className="text-xs text-gray-400">▾</span>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-full left-3 right-3 z-50 mb-2 rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-fade-in">
              <Link
                href="/dashboard/profile"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>👤</span> Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>⚙</span> Settings
              </Link>
              <hr className="my-1 border-gray-100" />
              <form action="/auth/signout" method="get">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <span>✕</span> Sign out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
