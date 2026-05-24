export interface SocketEventMap {
  // connection state
  connect: void;
  disconnect: { reason: string };

  // presence
  room_users: Array<{
    socketId: string;
    userId: string;
    name: string;
    email: string;
    joinedAt: number;
  }>;
  user_joined: { userId: string; name: string; participantCount: number };
  user_left: { userId: string; participantCount: number };

  // room mode
  room_type_changed: { mode: "SILENT_ACCOUNTABILITY" | "ACTIVE_DISCUSSION" };

  // timer
  timer_update: { status: "working" | "paused" | "break" | "idle"; timeLeft: number; duration?: number };
  timer_tick: { status: "working" | "break"; timeLeft: number };
  timer_completed: { message: string };

  // resources
  resource_list: Array<{
    id: string;
    url: string;
    title: string;
    sharedBy: { userId: string; name: string };
    timestamp: number;
  }>;
  new_resource: {
    id: string;
    url: string;
    title: string;
    sharedBy: { userId: string; name: string };
    timestamp: number;
  };

  // chat
  chat_message: {
    id: string;
    userId: string;
    name: string;
    text: string;
    timestamp: number;
  };

  // room lifecycle
  room_closed: { message: string };
}

export interface SocketClientEvents {
  join_room: { roomId: string; name?: string };
  leave_room: void;
  set_room_type: { mode: "SILENT_ACCOUNTABILITY" | "ACTIVE_DISCUSSION" };
  start_timer: { duration: number };
  pause_timer: void;
  resume_timer: void;
  reset_timer: void;
  share_resource: { url: string; title?: string };
  chat_message: { text: string };
  force_close: void;
}
