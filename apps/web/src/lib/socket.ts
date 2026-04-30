import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";

let socket: Socket | null = null;
let queryClient: QueryClient | null = null;

export function setQueryClient(qc: QueryClient) {
  queryClient = qc;
}

export function connectSocket(token: string) {
  if (socket?.connected) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

  socket = io(wsUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  socket.on("new_message", () => {
    queryClient?.invalidateQueries({ queryKey: ["conversations"] });
  });

  socket.on("message_status", () => {
    queryClient?.invalidateQueries({ queryKey: ["conversations"] });
  });

  socket.on("assignment_change", () => {
    queryClient?.invalidateQueries({ queryKey: ["conversations"] });
  });

  socket.on("conversation_update", () => {
    queryClient?.invalidateQueries({ queryKey: ["conversations"] });
  });

  // typing_start and typing_stop are handled by individual components
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
