"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StudyRoom } from "@/lib/types";

export default function StudyRoomsPage() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await api.get("/studyrooms");
      setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/studyrooms", { topic });
    setTopic("");
    setShowCreate(false);
    loadRooms();
  };

  const endRoom = async (id: string) => {
    await api.patch(`/studyrooms/${id}/end`);
    loadRooms();
  };

  const formatDuration = (started: string) => {
    const diff = Date.now() - new Date(started).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div>
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Study Rooms</h1>
            <p className="text-sm text-gray-500">{rooms.length} active room{rooms.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Room
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Create Study Room</h2>
            <form onSubmit={createRoom} className="mt-4 space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What are you studying?"
                required
                className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Start Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="card-static mx-auto max-w-md p-12 text-center">
            <div className="text-5xl">🎧</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No active rooms</h3>
            <p className="mt-2 text-sm text-gray-500">Start a study session or find one to join.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-6">Start Studying</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div key={room.id} className="card-static p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse-soft" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{room.topic}</h3>
                    <p className="text-xs text-gray-400">by {room.host.firstName} {room.host.lastName}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400">{formatDuration(room.startedAt)}</span>
                  <button
                    onClick={() => endRoom(room.id)}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
