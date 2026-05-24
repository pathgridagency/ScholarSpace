"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    major: "",
    gradYear: "",
  });

  useEffect(() => {
    api.get("/users/me").then((data) => {
      setProfile(data);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        major: data.major || "",
        gradYear: data.gradYear?.toString() || "",
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

  const initials = profile
    ? (form.firstName?.charAt(0)?.toUpperCase() || profile.email?.charAt(0).toUpperCase() || "?")
    : "?";

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
        <div className="card-static p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-md">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {form.firstName || form.lastName
                  ? `${form.firstName} ${form.lastName}`.trim()
                  : "Set your name"}
              </h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              {profile?.stats && (
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>{profile.stats.projects} projects</span>
                  <span>{profile.stats.listings} listings</span>
                  <span>{profile.stats.pendingTasks} active tasks</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={save} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Major</label>
                <input
                  type="text"
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grad year</label>
                <input
                  type="number"
                  value={form.gradYear}
                  onChange={(e) => setForm({ ...form, gradYear: e.target.value })}
                  placeholder="e.g. 2028"
                  className="input-focus mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save changes"}
              </button>
              {message && (
                <span className={`animate-fade-in text-sm ${message === "Profile saved!" ? "text-emerald-600" : "text-red-600"}`}>
                  {message}
                </span>
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
