import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "./api";
import type { SocketEventMap, SocketClientEvents } from "./socket-events";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

type EventCallback<E extends keyof SocketEventMap> = (data: SocketEventMap[E]) => void;

export function useStudyRoomSocket(roomId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<SocketEventMap["room_users"]>([]);
  const [timer, setTimer] = useState<SocketEventMap["timer_update"] | null>(null);
  const [resources, setResources] = useState<SocketEventMap["resource_list"]>([]);
  const [roomMode, setRoomMode] = useState<"SILENT_ACCOUNTABILITY" | "ACTIVE_DISCUSSION" | null>(null);
  const [messages, setMessages] = useState<SocketEventMap["chat_message"][]>([]);
  const [closed, setClosed] = useState(false);

  const callbacksRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    (async () => {
      let token: string | null = null;
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token ?? null;
        }
      } catch {
        /* ignore */
      }
      if (cancelled || !token) return;

      const socket = io(`${SOCKET_URL}/ws/studyrooms`, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      socket.on("room_users", (data: SocketEventMap["room_users"]) => setUsers(data));
      socket.on("user_joined", (data) => setUsers((prev) => [...prev, data as unknown as SocketEventMap["room_users"][number]]));
      socket.on("user_left", (data) => {
        setUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      });

      socket.on("timer_update", (data: SocketEventMap["timer_update"]) => setTimer(data));
      socket.on("timer_tick", (data: SocketEventMap["timer_tick"]) => setTimer((prev) => prev ? { ...prev, timeLeft: data.timeLeft } : { status: data.status, timeLeft: data.timeLeft }));
      socket.on("timer_completed", () => {
        /* play notification sound or show alert */
      });

      socket.on("resource_list", (data: SocketEventMap["resource_list"]) => setResources(data));
      socket.on("new_resource", (data: SocketEventMap["new_resource"]) => setResources((prev) => [...prev, data]));

      socket.on("room_type_changed", (data: SocketEventMap["room_type_changed"]) => setRoomMode(data.mode));

      socket.on("chat_message", (data: SocketEventMap["chat_message"]) => setMessages((prev) => [...prev, data]));

      socket.on("room_closed", () => setClosed(true));

      socket.emit("join_room", { roomId, name: undefined });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.emit("leave_room");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setUsers([]);
      setTimer(null);
      setResources([]);
      setRoomMode(null);
      setMessages([]);
      setClosed(false);
    };
  }, [roomId]);

  const emit = useCallback(<E extends keyof SocketClientEvents>(
    event: E,
    data: SocketClientEvents[E]
  ) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback(<E extends keyof SocketEventMap>(
    event: E,
    callback: EventCallback<E>
  ) => {
    const cb = callback as (...args: unknown[]) => void;
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event)!.add(cb);
    socketRef.current?.on(event, cb);
    return () => {
      callbacksRef.current.get(event)?.delete(cb);
      socketRef.current?.off(event, cb);
    };
  }, []);

  return {
    connected,
    users,
    timer,
    resources,
    roomMode,
    messages,
    closed,
    emit,
    on,
  };
}
