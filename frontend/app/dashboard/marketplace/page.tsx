"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MarketplaceListing } from "@/lib/types";

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{ email: string; name: string } | null>(null);

  const [form, setForm] = useState({ type: "TEXTBOOK", title: "", isbn: "", price: "" });
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/users/me").then((u) => setMyId(u.id)).catch(() => {});
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = filter ? `?type=${filter}&status=AVAILABLE` : "?status=AVAILABLE";
      setListings(await api.get(`/marketplace${params}`));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createListing = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/marketplace", {
      type: form.type, title: form.title,
      isbn: form.isbn || undefined, price: parseFloat(form.price),
    });
    setForm({ type: "TEXTBOOK", title: "", isbn: "", price: "" });
    setShowCreate(false);
    loadListings();
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await api.delete(`/marketplace/${id}`);
    loadListings();
  };

  const contactSeller = async (sellerId: string) => {
    setContactId(sellerId);
    try {
      const user = await api.get(`/users/${sellerId}`);
      setContactInfo({ email: user.email, name: `${user.firstName} ${user.lastName}`.trim() });
    } catch { setContactInfo(null); }
  };

  const typeColors: Record<string, string> = {
    TEXTBOOK: "bg-blue-50 text-blue-700 border-blue-200",
    NOTES: "bg-purple-50 text-purple-700 border-purple-200",
    STUDY_GUIDE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const typeLabels: Record<string, string> = {
    TEXTBOOK: "Textbook", NOTES: "Notes", STUDY_GUIDE: "Study Guide",
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Marketplace</h1>
            <p className="text-sm text-gray-500">Buy and sell study materials</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Listing</button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">New Listing</h2>
            <form onSubmit={createListing} className="mt-4 space-y-4">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm">
                <option value="TEXTBOOK">Textbook</option>
                <option value="NOTES">Notes</option>
                <option value="STUDY_GUIDE">Study Guide</option>
              </select>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN (optional)" className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" required className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Post Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contactId && contactInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => { setContactId(null); setContactInfo(null); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Contact Seller</h3>
              <button onClick={() => { setContactId(null); setContactInfo(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">{contactInfo.name}</p>
              <a href={`mailto:${contactInfo.email}`} className="text-sm text-indigo-600 hover:text-indigo-500">{contactInfo.email}</a>
            </div>
            <p className="mt-3 text-xs text-gray-400">Send an email to coordinate the transaction.</p>
          </div>
        </div>
      )}

      <div className="border-b border-gray-100 px-8 py-3">
        <div className="flex gap-2">
          <button onClick={() => setFilter(null)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!filter ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}>All</button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === key ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
        ) : listings.length === 0 ? (
          <div className="card-static mx-auto max-w-md p-12 text-center">
            <div className="text-5xl">📚</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No listings yet</h3>
            <p className="mt-2 text-sm text-gray-500">Be the first to list something.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <div key={listing.id} className="card-static p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[listing.type]}`}>{typeLabels[listing.type]}</span>
                  <span className="text-lg font-bold text-gray-900">${Number(listing.price).toFixed(2)}</span>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{listing.title}</h3>
                {listing.isbn && <p className="mt-1 text-xs text-gray-400">ISBN: {listing.isbn}</p>}
                <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400">{listing.seller.firstName} {listing.seller.lastName}</span>
                  <div className="flex gap-2">
                    {listing.sellerId !== myId ? (
                      <button onClick={() => contactSeller(listing.sellerId)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">Contact</button>
                    ) : (
                      <button onClick={() => deleteListing(listing.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-50 transition-colors">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
