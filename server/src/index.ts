import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { ConnectionManager } from "./ConnectionManager";
import { WebSocketEvent } from "./types";

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
  }
}

const ALLOWED_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";
const PORT = process.env.PORT || 8080;

const httpServer = createServer((req, res) => {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Cryptographic Route Gateway - Use WebSocket Protocol.");
});

const wss = new WebSocketServer({ noServer: true });
const manager = new ConnectionManager();

manager.startHeartbeatSentinel();

httpServer.on("upgrade", (request, socket, head) => {
  const origin = request.headers.origin;

  if (origin !== ALLOWED_ORIGIN) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (wsClient) => {
    wss.emit("connection", wsClient, request);
  });
});

wss.on("connection", (ws: WebSocket) => {
  ws.isAlive = true;
  console.log(
    "[WS AUTH] Client established authorized cryptographic socket pipe.",
  );

  let connectedUserId: string | null = null;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (rawBufferData) => {
    try {
      const stringifiedPayload = rawBufferData.toString();
      const wsEvent = JSON.parse(stringifiedPayload) as WebSocketEvent;

      switch (wsEvent.type) {
        case "SUBSCRIBE": {
          connectedUserId = wsEvent.payload.userId;
          const { roomId, targetUserId } = wsEvent.payload;

          manager.registerConnection(connectedUserId, ws);

          if (roomId) {
            manager.joinRoom(roomId, connectedUserId);
            console.log(
              `[SUBSCRIPTION] User: ${connectedUserId} subscribed to room [${wsEvent.payload.roomId}]`,
            );

            if (targetUserId) {
              const isTargetOnline = manager.isUserConnected(targetUserId);
              ws.send(
                JSON.stringify({
                  type: "USER_STATUS_CHANGE",
                  payload: { userId: targetUserId, isOnline: isTargetOnline },
                }),
              );
            }

            manager.broadcastToRoom(
              roomId,
              connectedUserId,
              JSON.stringify({
                type: "USER_STATUS_CHANGE",
                payload: { userId: connectedUserId, isOnline: true },
              }),
            );
          } else {
            console.log(
              `[SUBSCRIPTION] User: ${connectedUserId} connected globally.`,
            );
          }
          break;
        }

        case "UNSUBSCRIBE": {
          if (connectedUserId && wsEvent.payload.roomId) {
            manager.leaveRoom(wsEvent.payload.roomId, connectedUserId);
            console.log(
              `[UNSUBSCRIBE] User: ${connectedUserId} unsubscribed to room [${wsEvent.payload.roomId}]`,
            );
          }
          break;
        }

        case "ENCRYPTED_MESSAGE": {
          const { roomId, message, recipientId } = wsEvent.payload;
          const senderId = message.senderId;

          console.log(
            `[MESSAGE RELAY] Room: [${roomId}] <- Sender: ${senderId}`,
          );
          manager.broadcastToRoom(roomId, senderId, stringifiedPayload);

          // In case the recipient exists and is NOT currently viewing this room
          if (recipientId && !manager.isUserInRoom(roomId, recipientId)) {
            console.log(
              `[MESSAGE RELAY] Recipient ${recipientId} is outside room [${roomId}].`,
            );
            manager.sendToUser(recipientId, stringifiedPayload);
          }
          break;
        }

        case "TYPING_STATUS": {
          console.log(
            `[TYPING STATUS] Room: [${wsEvent.payload.roomId}] <- User: ${wsEvent.payload.userId} (Typing: ${wsEvent.payload.isTyping})`,
          );
          manager.broadcastToRoom(
            wsEvent.payload.roomId,
            wsEvent.payload.userId,
            stringifiedPayload,
          );
          break;
        }

        case "ROOM_CREATED": {
          console.log(
            `[ROOM SYNC] New Room Sync -> Target User: ${wsEvent.payload.recipientId}`,
          );
          manager.sendToUser(wsEvent.payload.recipientId, stringifiedPayload);
          break;
        }

        case "MARK_READ": {
          const { roomId, readerId, lastReadMessageId, recipientId } =
            wsEvent.payload;

          console.log(
            `[READ MESSAGE STATUS] Message ${lastReadMessageId} was read by ${readerId}`,
          );
          manager.broadcastToRoom(roomId, readerId, stringifiedPayload);

          if (recipientId && !manager.isUserInRoom(roomId, recipientId)) {
            manager.sendToUser(recipientId, stringifiedPayload);
          }
          break;
        }
      }
    } catch (parseError) {
      console.error(
        "[WS ERROR] Malformed websocket frame discarded:",
        parseError,
      );
    }
  });

  ws.on("error", (error) => {
    console.error("[WS EXCEPTION] Socket pipeline disruption:", error.message);
  });

  ws.on("close", () => {
    if (connectedUserId) {
      const userId = connectedUserId;
      const rooms = manager.getUserRooms(connectedUserId);

      manager.removeConnection(connectedUserId);

      rooms.forEach((roomId) => {
        manager.leaveRoom(roomId, userId);
      });
      console.log(`[WS TEARDOWN] Session cleaned for User: ${connectedUserId}`);

      rooms.forEach((roomId) => {
        manager.broadcastToRoom(
          roomId,
          connectedUserId!,
          JSON.stringify({
            type: "USER_STATUS_CHANGE",
            payload: { userId: connectedUserId, isOnline: false },
          }),
        );
      });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Gateway routing engine live on port ${PORT}`);
});
