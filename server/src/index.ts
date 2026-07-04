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
  console.log("Client established authorized cryptographic socket pipe.");

  let connectedUserId: string | null = null;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (rawBufferData) => {
    try {
      const stringifiedPayload = rawBufferData.toString();
      const wsEvent = JSON.parse(stringifiedPayload) as WebSocketEvent;

      switch (wsEvent.type) {
        case "SUBSCRIBE":
          connectedUserId = wsEvent.payload.userId;
          manager.registerConnection(connectedUserId, ws);
          manager.joinRoom(wsEvent.payload.roomId, connectedUserId);
          console.log(
            `User ${connectedUserId} subscribed to track Frame room [${wsEvent.payload.roomId}]`,
          );
          break;

        case "UNSUBSCRIBE":
          if (connectedUserId) {
            manager.leaveRoom(wsEvent.payload.roomId, connectedUserId);
          }
          break;

        case "ENCRYPTED_MESSAGE":
          manager.broadcastToRoom(
            wsEvent.payload.roomId,
            wsEvent.payload.senderId,
            stringifiedPayload,
          );
          break;

        case "TYPING_STATUS":
          manager.broadcastToRoom(
            wsEvent.payload.roomId,
            wsEvent.payload.userId,
            stringifiedPayload,
          );
          break;
      }
    } catch (parseError) {
      console.error("Malformed websocket framse discarded:", parseError);
    }
  });

  ws.on("error", (error) => {
    console.error("Socket pipeline disruption:", error);
  });

  ws.on("close", () => {
    if (connectedUserId) {
      manager.removeConnection(connectedUserId);
      console.log(
        `Session torn down for authenticated identification ID: ${connectedUserId}`,
      );
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Gateway routing engine live on port ${PORT}`);
});
