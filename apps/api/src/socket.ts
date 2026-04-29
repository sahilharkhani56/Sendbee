import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { ROLE_PERMISSIONS, Permission } from "@whatsapp-crm/shared";

// ═══════════════════════════════════════════════════════════
// Socket.io Real-Time Server
// ═══════════════════════════════════════════════════════════

let io: SocketServer | null = null;

interface AuthenticatedSocket extends Socket {
  tenantId: string;
  userId: string;
  userRole: string;
  userPermissions: Permission[];
}

interface TenantTokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  type: "tenant";
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ─── JWT Authentication Middleware ───────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("AUTH_TOKEN_MISSING"));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TenantTokenPayload;

      if (decoded.type !== "tenant") {
        return next(new Error("AUTH_WRONG_CONTEXT"));
      }

      // Inject auth data into socket
      (socket as AuthenticatedSocket).tenantId = decoded.tenantId;
      (socket as AuthenticatedSocket).userId = decoded.userId;
      (socket as AuthenticatedSocket).userRole = decoded.role;
      (socket as AuthenticatedSocket).userPermissions = (ROLE_PERMISSIONS[decoded.role] ?? []) as Permission[];

      next();
    } catch {
      return next(new Error("AUTH_TOKEN_INVALID"));
    }
  });

  // ─── Connection Handler ─────────────────────────────────
  io.on("connection", (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { tenantId, userId, userRole } = socket;

    // Join tenant room (tenant isolation — CRITICAL)
    socket.join(`tenant:${tenantId}`);

    // Join personal room (for direct notifications)
    socket.join(`user:${userId}`);

    console.log(`[Socket.io] Connected: user=${userId} tenant=${tenantId} role=${userRole}`);

    // ─── Client Events ────────────────────────────────────

    // Join a specific conversation room (for typing indicators)
    socket.on("join_conversation", (conversationId: string) => {
      if (typeof conversationId === "string" && conversationId.length > 0) {
        socket.join(`conversation:${tenantId}:${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: string) => {
      if (typeof conversationId === "string" && conversationId.length > 0) {
        socket.leave(`conversation:${tenantId}:${conversationId}`);
      }
    });

    // Typing indicator
    socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
      if (data?.conversationId) {
        socket.to(`conversation:${tenantId}:${data.conversationId}`).emit("typing", {
          userId,
          conversationId: data.conversationId,
          isTyping: data.isTyping,
        });
      }
    });

    // Mark conversation as read (emit to other team members)
    socket.on("mark_read", (data: { conversationId: string }) => {
      if (data?.conversationId) {
        socket.to(`tenant:${tenantId}`).emit("conversation_read", {
          conversationId: data.conversationId,
          userId,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Disconnected: user=${userId} reason=${reason}`);
    });
  });

  return io;
}

// ═══════════════════════════════════════════════════════════
// Emit helpers (called from route handlers / webhook)
// ═══════════════════════════════════════════════════════════

/** Emit to all connected users of a tenant */
export function emitToTenant(tenantId: string, event: string, data: unknown): void {
  io?.to(`tenant:${tenantId}`).emit(event, data);
}

/** Emit to a specific user */
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

/** Emit to users viewing a specific conversation */
export function emitToConversation(tenantId: string, conversationId: string, event: string, data: unknown): void {
  io?.to(`conversation:${tenantId}:${conversationId}`).emit(event, data);
}

/** Get the Socket.io server instance */
export function getIO(): SocketServer | null {
  return io;
}

// ═══════════════════════════════════════════════════════════
// Event Types (for frontend integration)
// ═══════════════════════════════════════════════════════════
//
// Server → Client events:
//   "new_message"         → { conversationId, message }
//   "message_status"      → { messageId, status }
//   "conversation_update" → { conversationId, changes }
//   "conversation_read"   → { conversationId, userId }
//   "assignment_change"   → { conversationId, assignedTo }
//   "typing"              → { userId, conversationId, isTyping }
//   "notification"        → { type, title, body }
//   "appointment_update"  → { appointmentId, status }
//
// Client → Server events:
//   "join_conversation"   → conversationId
//   "leave_conversation"  → conversationId
//   "typing"              → { conversationId, isTyping }
//   "mark_read"           → { conversationId }
