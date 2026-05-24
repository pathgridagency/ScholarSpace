"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationPrefs {
  projectUpdates: boolean;
  marketplaceActivity: boolean;
  studyRoomInvites: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    projectUpdates: true,
    marketplaceActivity: true,
    studyRoomInvites: true,
  });
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    api.get("/users/me").then(setProfile).catch(() => {});
    const stored = localStorage.getItem("scholarspace-notifications");
    if (stored) {
      try { setPrefs(JSON.parse(stored)); } catch {}
    }
    const storedTheme = localStorage.getItem("scholarspace-theme");
    if (storedTheme === "dark") setTheme("dark");
  }, []);

  const toggle = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem("scholarspace-notifications", JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("scholarspace-theme", next);
  };

  const handleSignOut = async () => {
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">App preferences</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-8 py-8 space-y-6">
        {profile && (
          <div className="card-static p-6">
            <h3 className="font-semibold text-gray-900">Account</h3>
            <p className="mt-1 text-sm text-gray-500">Signed in as {profile.email}</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
                {profile.firstName?.charAt(0) || profile.email?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{`${profile.firstName} ${profile.lastName}`.trim()}</p>
                <p className="text-xs text-gray-400">{profile.email}</p>
              </div>
              <Link href="/dashboard/profile" className="ml-auto text-sm font-medium text-indigo-600 hover:text-indigo-500">Edit</Link>
            </div>
          </div>
        )}

        <div className="card-static p-6">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <p className="mt-1 text-sm text-gray-500">Preferences are saved locally.</p>
          <div className="mt-4 space-y-3">
            {[
              { key: "projectUpdates" as const, label: "Project updates" },
              { key: "marketplaceActivity" as const, label: "Marketplace activity" },
              { key: "studyRoomInvites" as const, label: "Study room invites" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm text-gray-700">{label}</span>
                <div
                  onClick={() => toggle(key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key] ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[key] ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </label>
            ))}
          </div>
          {saved && <p className="mt-2 text-xs text-emerald-600">Preferences saved</p>}
        </div>

        <div className="card-static p-6">
          <h3 className="font-semibold text-gray-900">Appearance</h3>
          <p className="mt-1 text-sm text-gray-500">Toggle between light and dark mode.</p>
          <div className="mt-4">
            <button onClick={toggleTheme} className="btn-secondary text-sm">
              {theme === "light" ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>
          </div>
        </div>

        <div className="card-static p-6">
          <h3 className="font-semibold text-gray-900">Danger zone</h3>
          <p className="mt-1 text-sm text-gray-500">Irreversible actions.</p>
          <div className="mt-4">
            <button onClick={handleSignOut} className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
