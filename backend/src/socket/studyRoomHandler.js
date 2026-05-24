const participants = new Map();
const timerStates = new Map();
const resources = new Map();
const roomModes = new Map();

function getRoomUsers(roomId) {
  const set = participants.get(roomId);
  if (!set) return [];
  return Array.from(set.values());
}

function broadcastRoomUsers(io, roomId) {
  io.to(roomId).emit("room_users", getRoomUsers(roomId));
}

function startTimerInterval(io, roomId, duration) {
  if (timerStates.has(roomId)) {
    clearInterval(timerStates.get(roomId).interval);
  }

  const state = { status: "working", timeLeft: duration, duration };

  const interval = setInterval(() => {
    state.timeLeft -= 1;
    io.to(roomId).emit("timer_tick", { status: state.status, timeLeft: state.timeLeft });

    if (state.timeLeft <= 0) {
      clearInterval(interval);
      state.status = "break";
      state.timeLeft = 300;
      io.to(roomId).emit("timer_completed", { message: "Focus session complete! Time for a short break." });

      const breakInterval = setInterval(() => {
        state.timeLeft -= 1;
        io.to(roomId).emit("timer_tick", { status: "break", timeLeft: state.timeLeft });

        if (state.timeLeft <= 0) {
          clearInterval(breakInterval);
          state.status = "idle";
          state.timeLeft = 0;
          timerStates.delete(roomId);
          io.to(roomId).emit("timer_update", { status: "idle", timeLeft: 0 });
        }
      }, 1000);

      state.interval = breakInterval;
    }
  }, 1000);

  state.interval = interval;
  timerStates.set(roomId, state);

  io.to(roomId).emit("timer_update", { status: state.status, timeLeft: state.timeLeft, duration: state.duration });
}

export function setupStudyRoomSocket(io) {
  const authIo = io.of("/ws/studyrooms");

  authIo.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });

      if (!response.ok) return next(new Error("Invalid or expired token"));

      const user = await response.json();
      if (!user || !user.id) return next(new Error("Invalid or expired token"));

      socket.data.user = { userId: user.id, email: user.email };
      next();
    } catch {
      next(new Error("Auth verification failed"));
    }
  });

  authIo.on("connection", (socket) => {
    const { userId, email } = socket.data.user;

    socket.on("join_room", (data) => {
      const { roomId, name } = data;
      if (!roomId) return;

      socket.join(roomId);
      socket.data.roomId = roomId;

      if (!participants.has(roomId)) {
        participants.set(roomId, new Map());
      }
      participants.get(roomId).set(socket.id, {
        socketId: socket.id,
        userId,
        name: name || email.split("@")[0],
        email,
        joinedAt: Date.now(),
      });

      socket.to(roomId).emit("user_joined", {
        userId,
        name: name || email.split("@")[0],
        participantCount: participants.get(roomId).size,
      });

      broadcastRoomUsers(authIo, roomId);

      const currentTimer = timerStates.get(roomId);
      if (currentTimer) {
        socket.emit("timer_update", {
          status: currentTimer.status,
          timeLeft: currentTimer.timeLeft,
          duration: currentTimer.duration,
        });
      }

      const currentMode = roomModes.get(roomId);
      if (currentMode) {
        socket.emit("room_type_changed", { mode: currentMode });
      }

      const roomResources = resources.get(roomId);
      if (roomResources && roomResources.length > 0) {
        socket.emit("resource_list", roomResources);
      }
    });

    socket.on("leave_room", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      socket.leave(roomId);

      const set = participants.get(roomId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          participants.delete(roomId);
        } else {
          socket.to(roomId).emit("user_left", {
            userId,
            participantCount: set.size,
          });
          broadcastRoomUsers(authIo, roomId);
        }
      }

      socket.data.roomId = null;
    });

    socket.on("set_room_type", (data) => {
      const roomId = socket.data.roomId;
      const { mode } = data;

      if (!roomId || !mode) return;
      if (!["SILENT_ACCOUNTABILITY", "ACTIVE_DISCUSSION"].includes(mode)) return;

      roomModes.set(roomId, mode);
      authIo.to(roomId).emit("room_type_changed", { mode });
    });

    socket.on("start_timer", (data) => {
      const roomId = socket.data.roomId;
      const { duration } = data;

      if (!roomId) return;
      startTimerInterval(authIo, roomId, duration || 1500);
    });

    socket.on("pause_timer", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const state = timerStates.get(roomId);
      if (state && state.interval) {
        clearInterval(state.interval);
        state.interval = null;
        state.status = "paused";
        authIo.to(roomId).emit("timer_update", {
          status: "paused",
          timeLeft: state.timeLeft,
          duration: state.duration,
        });
      }
    });

    socket.on("resume_timer", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const state = timerStates.get(roomId);
      if (state && state.status === "paused") {
        state.status = "working";
        const interval = setInterval(() => {
          state.timeLeft -= 1;
          authIo.to(roomId).emit("timer_tick", {
            status: state.status,
            timeLeft: state.timeLeft,
          });

          if (state.timeLeft <= 0) {
            clearInterval(interval);
            state.status = "break";
            state.timeLeft = 300;
            authIo.to(roomId).emit("timer_completed", {
              message: "Focus session complete!",
            });

            const breakInterval = setInterval(() => {
              state.timeLeft -= 1;
              authIo.to(roomId).emit("timer_tick", {
                status: "break",
                timeLeft: state.timeLeft,
              });

              if (state.timeLeft <= 0) {
                clearInterval(breakInterval);
                state.status = "idle";
                state.timeLeft = 0;
                timerStates.delete(roomId);
                authIo.to(roomId).emit("timer_update", { status: "idle", timeLeft: 0 });
              }
            }, 1000);
            state.interval = breakInterval;
          }
        }, 1000);

        state.interval = interval;
        authIo.to(roomId).emit("timer_update", {
          status: "working",
          timeLeft: state.timeLeft,
          duration: state.duration,
        });
      }
    });

    socket.on("reset_timer", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const state = timerStates.get(roomId);
      if (state) {
        clearInterval(state.interval);
        timerStates.delete(roomId);
        authIo.to(roomId).emit("timer_update", { status: "idle", timeLeft: 0, duration: 1500 });
      }
    });

    socket.on("share_resource", (data) => {
      const roomId = socket.data.roomId;
      const { url, title } = data;

      if (!roomId || !url) return;

      if (!resources.has(roomId)) {
        resources.set(roomId, []);
      }

      const resource = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        title: title || url,
        sharedBy: { userId, name: email.split("@")[0] },
        timestamp: Date.now(),
      };

      resources.get(roomId).push(resource);
      authIo.to(roomId).emit("new_resource", resource);
    });

    socket.on("chat_message", (data) => {
      const roomId = socket.data.roomId;
      const { text } = data;

      if (!roomId || !text?.trim()) return;

      authIo.to(roomId).emit("chat_message", {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        name: email.split("@")[0],
        text: text.trim(),
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const set = participants.get(roomId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          participants.delete(roomId);
        } else {
          authIo.to(roomId).emit("user_left", {
            userId,
            participantCount: set.size,
          });
          broadcastRoomUsers(authIo, roomId);
        }
      }
    });

    socket.on("force_close", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const state = timerStates.get(roomId);
      if (state) {
        clearInterval(state.interval);
        timerStates.delete(roomId);
      }
      resources.delete(roomId);
      roomModes.delete(roomId);
      participants.delete(roomId);

      authIo.to(roomId).emit("room_closed", { message: "Study room has ended." });
      const sockets = authIo.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        for (const sid of sockets) {
          const sock = authIo.sockets.sockets.get(sid);
          if (sock) {
            sock.leave(roomId);
            sock.data.roomId = null;
          }
        }
      }
    });
  });
}
