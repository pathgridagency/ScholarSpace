"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { StudyRoom } from "@/lib/types";

type RoomMode = "SILENT_ACCOUNTABILITY" | "ACTIVE_DISCUSSION";
type TimerStatus = "idle" | "working" | "paused" | "break";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

interface Resource {
  id: string;
  url: string;
  title: string;
  sharedBy: string;
  timestamp: number;
}

interface ChatMsg {
  id: string;
  userId: string;
  name: string;
  text: string;
  timestamp: number;
}

const POMODORO_DURATION = 1500;
const BREAK_DURATION = 300;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function StudyRoomLivePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || "";

  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([{ id: "loading", name: "Loading...", isHost: false }]);
  const [roomMode, setRoomMode] = useState<RoomMode>("SILENT_ACCOUNTABILITY");
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [resources, setResources] = useState<Resource[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [showAddResource, setShowAddResource] = useState(false);
  const [activeTab, setActiveTab] = useState<"resources" | "chat">("chat");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHost = myId && room?.hostId === myId;

  useEffect(() => {
    api.get("/users/me").then((u) => {
      setMyId(u.id);
      loadRoom(u.id);
    }).catch(() => loadRoom());
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRoom = async (userId?: string) => {
    try {
      const rooms: StudyRoom[] = await api.get("/studyrooms");
      const found = rooms.find((r) => r.id === roomId);
      if (found) {
        setRoom(found);
        const uid = userId || myId;
        if (uid && found.hostId === uid) {
          setParticipants([{ id: found.hostId, name: `${found.host.firstName} ${found.host.lastName}`, isHost: true }]);
        } else {
          loadRoomById(found);
        }
      } else {
        setError("Room not found or has ended");
      }
    } catch {
      setError("Failed to load room");
    } finally {
      setLoading(false);
    }
  };

  const loadRoomById = async (found: StudyRoom) => {
    try {
      const user = await api.get("/users/me");
      setParticipants([
        { id: found.hostId, name: `${found.host.firstName} ${found.host.lastName}`, isHost: true },
        { id: user.id, name: user.firstName || "You", isHost: false },
      ]);
    } catch {
      setParticipants([{ id: found.hostId, name: `${found.host.firstName} ${found.host.lastName}`, isHost: true }]);
    }
  };

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    cleanupTimers();
    setTimerStatus("working");
    setTimeLeft(POMODORO_DURATION);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanupTimers();
          setTimerStatus("break");
          setTimeLeft(BREAK_DURATION);
          startBreakTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanupTimers]);

  const startBreakTimer = useCallback(() => {
    cleanupTimers();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanupTimers();
          setTimerStatus("idle");
          setTimeLeft(POMODORO_DURATION);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanupTimers]);

  const pauseTimer = useCallback(() => {
    cleanupTimers();
    setTimerStatus("paused");
  }, [cleanupTimers]);

  const resumeTimer = useCallback(() => {
    if (timerStatus !== "paused") return;
    setTimerStatus("working");
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanupTimers();
          setTimerStatus("break");
          setTimeLeft(BREAK_DURATION);
          startBreakTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerStatus, cleanupTimers, startBreakTimer]);

  const resetTimer = useCallback(() => {
    cleanupTimers();
    setTimerStatus("idle");
    setTimeLeft(POMODORO_DURATION);
  }, [cleanupTimers]);

  useEffect(() => {
    return () => cleanupTimers();
  }, [cleanupTimers]);

  const endRoom = async () => {
    if (!confirm("End this study room for everyone?")) return;
    await api.patch(`/studyrooms/${roomId}/end`);
    router.push("/dashboard/study-rooms");
  };

  const leaveRoom = () => {
    router.push("/dashboard/study-rooms");
  };

  const addResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceUrl.trim()) return;
    const res: Resource = {
      id: `res-${Date.now()}`,
      url: resourceUrl,
      title: resourceTitle.trim() || resourceUrl,
      sharedBy: "You",
      timestamp: Date.now(),
    };
    setResources((prev) => [...prev, res]);
    setResourceUrl("");
    setResourceTitle("");
    setShowAddResource(false);
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg: ChatMsg = {
      id: `msg-${Date.now()}`,
      userId: myId || "",
      name: "You",
      text: chatInput.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const timerProgress = timerStatus === "idle" ? 1 : timeLeft / POMODORO_DURATION;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-500">{error || "Room not found"}</p>
        <button onClick={() => router.push("/dashboard/study-rooms")} className="btn-primary text-sm">Back to Study Rooms</button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <button onClick={leaveRoom} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100">
            ← Back
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{room?.topic || "Study Room"}</h2>
            <p className="text-xs text-gray-400">
              Hosted by {room?.host.firstName} {room?.host.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isHost && (
            <>
              <select
                value={roomMode}
                onChange={(e) => setRoomMode(e.target.value as RoomMode)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
              >
                <option value="SILENT_ACCOUNTABILITY">🔇 Silent Accountability</option>
                <option value="ACTIVE_DISCUSSION">🎤 Active Discussion</option>
              </select>
              <button onClick={endRoom} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50">
                End Room
              </button>
            </>
          )}
          <button onClick={leaveRoom} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
            Leave
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex w-56 flex-col border-r border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Participants ({participants.length})
          </h3>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[10px] font-semibold text-white">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-700">{p.name}</p>
                  {p.isHost && <span className="text-[10px] text-amber-500">Host</span>}
                </div>
                <div className={`h-2 w-2 rounded-full ${wsConnected ? "bg-emerald-400" : "bg-gray-300"}`} />
              </div>
            ))}
          </div>
          {!wsConnected && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-600">
              Real-time features unavailable
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center border-r border-gray-200">
          <div className="text-center">
            <div className="relative mx-auto mb-6 flex h-56 w-56 items-center justify-center">
              <svg className="absolute inset-0 h-56 w-56 -rotate-90" viewBox="0 0 224 224">
                <circle cx="112" cy="112" r="100" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="112" cy="112" r="100"
                  fill="none"
                  stroke={timerStatus === "break" ? "#10b981" : "#7c3aed"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 100 * timerProgress} ${2 * Math.PI * 100 * (1 - timerProgress)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="relative text-center">
                <div className="text-5xl font-bold tabular-nums text-gray-900">
                  {formatTime(timeLeft)}
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                  {timerStatus === "idle" && "Ready"}
                  {timerStatus === "working" && "Focus Time"}
                  {timerStatus === "paused" && "Paused"}
                  {timerStatus === "break" && "Break"}
                </p>
              </div>
            </div>

            {isHost ? (
              <div className="flex items-center justify-center gap-2">
                {timerStatus === "idle" && (
                  <button onClick={startTimer} className="btn-primary px-6 py-2 text-sm">Start Pomodoro</button>
                )}
                {timerStatus === "working" && (
                  <button onClick={pauseTimer} className="rounded-xl border border-gray-200 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Pause</button>
                )}
                {timerStatus === "paused" && (
                  <>
                    <button onClick={resumeTimer} className="btn-primary px-6 py-2 text-sm">Resume</button>
                    <button onClick={resetTimer} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50">Reset</button>
                  </>
                )}
                {timerStatus === "break" && (
                  <button onClick={resetTimer} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50">Skip Break</button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Only the host can control the timer</p>
            )}

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className={`h-2 w-2 rounded-full ${roomMode === "SILENT_ACCOUNTABILITY" ? "bg-indigo-400" : "bg-gray-300"}`} />
                Silent Accountability
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className={`h-2 w-2 rounded-full ${roomMode === "ACTIVE_DISCUSSION" ? "bg-indigo-400" : "bg-gray-300"}`} />
                Active Discussion
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-80 flex-col bg-white">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === "chat" ? "border-b-2 border-indigo-500 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === "resources" ? "border-b-2 border-indigo-500 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Resources ({resources.length})
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" ? (
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 && (
                    <p className="py-8 text-center text-xs text-gray-400">No messages yet. Say hi!</p>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[9px] font-semibold text-white">
                        {msg.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700">{msg.name}</p>
                        <p className="text-sm text-gray-600">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex items-center gap-2 border-t border-gray-100 p-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="input-focus flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                  />
                  <button type="submit" disabled={!chatInput.trim()} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex h-full flex-col p-4">
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {resources.length === 0 && (
                    <p className="py-8 text-center text-xs text-gray-400">No resources shared yet.</p>
                  )}
                  {resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-xs transition-colors hover:bg-gray-50"
                    >
                      <span className="shrink-0">📎</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-700">{res.title}</p>
                        <p className="text-[10px] text-gray-400">by {res.sharedBy}</p>
                      </div>
                    </a>
                  ))}
                </div>
                {showAddResource ? (
                  <form onSubmit={addResource} className="mt-3 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <input
                      type="url"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="URL (required)"
                      required
                      className="input-focus w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      placeholder="Title (optional)"
                      className="input-focus w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowAddResource(false)} className="rounded-lg px-3 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200">Cancel</button>
                      <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700">Share</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowAddResource(true)} className="mt-3 w-full rounded-lg border border-dashed border-gray-200 py-2 text-xs text-gray-400 transition-colors hover:border-indigo-300 hover:text-indigo-500">
                    + Share a Link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
