import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

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

  ws.on("error", (error) => {
    console.error("Socket pipeline disruption:", error);
  });

  ws.on("close", () => {
    console.log("Client disconnected. Tearing down stream structures.");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Gateway routing engine live on port ${PORT}`);
});
