"use client";

import Link from "next/link";

export default function SettingsPage() {
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
        <div className="card-static p-6">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <p className="mt-1 text-sm text-gray-500">Configure how you receive updates.</p>
          <div className="mt-4 space-y-3">
            {["Project updates", "Marketplace activity", "Study room invites"].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">{item}</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </label>
            ))}
          </div>
        </div>

        <div className="card-static p-6">
          <h3 className="font-semibold text-gray-900">Danger zone</h3>
          <p className="mt-1 text-sm text-gray-500">Irreversible actions.</p>
          <div className="mt-4">
            <form action="/auth/signout" method="get">
              <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
