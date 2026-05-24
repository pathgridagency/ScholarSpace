import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

export function useStudyRoomSocket(roomId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [timer, setTimer] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [roomMode, setRoomMode] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [closed, setClosed] = useState(false);

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
      } catch {}
      if (cancelled || !token) return;

      const socket = io(`${SOCKET_URL}/ws/studyrooms`, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("room_users", (data: any) => setUsers(data));
      socket.on("user_joined", (data: any) =>
        setUsers((prev) => [...prev, data])
      );
      socket.on("user_left", (data: any) =>
        setUsers((prev) => prev.filter((u: any) => u.userId !== data.userId))
      );
      socket.on("timer_update", (data: any) => setTimer(data));
      socket.on("timer_tick", (data: any) =>
        setTimer((prev: any) =>
          prev ? { ...prev, timeLeft: data.timeLeft } : { status: data.status, timeLeft: data.timeLeft }
        )
      );
      socket.on("resource_list", (data: any) => setResources(data));
      socket.on("new_resource", (data: any) => setResources((prev) => [...prev, data]));
      socket.on("room_type_changed", (data: any) => setRoomMode(data.mode));
      socket.on("chat_message", (data: any) => setMessages((prev) => [...prev, data]));
      socket.on("room_closed", () => setClosed(true));
      socket.on("connect_error", (err) => console.error("Socket error:", err.message));

      socket.emit("join_room", { roomId, name: undefined });
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

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return { connected, users, timer, resources, roomMode, messages, closed, emit, on };
}
