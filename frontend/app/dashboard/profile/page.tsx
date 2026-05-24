"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

interface University { id: string; name: string; domain: string }

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", major: "", gradYear: "", universityId: "",
  });

  useEffect(() => {
    Promise.all([
      api.get("/users/me"),
      api.get("/universities"),
    ]).then(([userData, uniData]) => {
      setProfile(userData);
      setUniversities(uniData);
      setForm({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        major: userData.major || "",
        gradYear: userData.gradYear?.toString() || "",
        universityId: userData.university?.id || "",
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.patch("/users/me", {
        firstName: form.firstName,
        lastName: form.lastName,
        major: form.major || null,
        gradYear: form.gradYear ? parseInt(form.gradYear) : null,
        universityId: form.universityId || null,
      });
      setProfile(updated);
      setMessage("Profile saved!");
      setTimeout(() => setMessage(null), 3000);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const initials = form.firstName?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "?";
  const displayName = `${form.firstName} ${form.lastName}`.trim() || "Set your name";
  const selectedUni = universities.find(u => u.id === form.universityId);

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-500">Manage your personal information</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-8 py-8">
        <div className="card-static overflow-hidden">
          <div className="gradient-subtle px-8 py-10 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white shadow-lg ring-4 ring-white">
              {initials}
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            {selectedUni && <p className="mt-1 text-xs text-gray-400">{selectedUni.name}</p>}
          </div>

          {profile?.stats && (
            <div className="grid grid-cols-4 border-b border-gray-100">
              {[
                { label: "Projects", value: profile.stats.projects },
                { label: "Listings", value: profile.stats.listings },
                { label: "Active Rooms", value: profile.stats.activeRooms },
                { label: "Pending Tasks", value: profile.stats.pendingTasks },
              ].map((s) => (
                <div key={s.label} className="border-r border-gray-100 py-4 text-center last:border-r-0">
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={save} className="space-y-5 p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First name</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last name</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Major</label>
                <input type="text" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} placeholder="e.g. Computer Science" className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grad year</label>
                <input type="number" value={form.gradYear} onChange={(e) => setForm({ ...form, gradYear: e.target.value })} placeholder="e.g. 2028" className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">University</label>
              <select value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value })} className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm">
                <option value="">Select your university</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save changes"}
              </button>
              {message && (
                <span className={`animate-fade-in text-sm ${message === "Profile saved!" ? "text-emerald-600" : "text-red-600"}`}>{message}</span>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6 card-static p-6">
          <h3 className="font-semibold text-gray-900">Account</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
