import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketEvent =
  | { type: "SUBSCRIBE"; payload: { roomId: string; userId: string } }
  | { type: "UNSUBSCRIBE"; payload: { roomId: string; userId: string } }
  | {
      type: "ENCRYPTED_MESSAGE";
      payload: {
        roomId: string;
        senderId: string;
        recipientId: string;
        encryptedPayload: string;
      };
    }
  | {
      type: "TYPING_STATUS";
      payload: { roomId: string; userId: string; isTyping: boolean };
    };

interface UseWebSocketOptions {
  url: string;
  roomId: string;
  userId: string;
  onMessageReceived: (event: WebSocketEvent) => void;
}

export function useWebSocket({
  url,
  roomId,
  userId,
  onMessageReceived,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (
      socketRef.current?.readyState === WebSocket.CONNECTING ||
      socketRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;

      const subscribeFrame: WebSocketEvent = {
        type: "SUBSCRIBE",
        payload: { roomId, userId },
      };

      ws.send(JSON.stringify(subscribeFrame));
    };

    ws.onmessage = (messageEvent) => {
      try {
        const parsedData = JSON.parse(messageEvent.data) as WebSocketEvent;
        onMessageReceived(parsedData);
      } catch (error) {
        console.error("Failed to decode incoming streaming packet:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        reconnectAttemptsRef.current += 1;

        setTimeout(() => connectRef.current(), delay);
      }
    };

    ws.onerror = (error) => {
      console.error("Client side socket lane dropped:", error);
    };
  }, [url, roomId, userId, onMessageReceived]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const emitEvent = useCallback((event: WebSocketEvent) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    } else {
      console.warn(
        "Unable to broadcast packet frame: Stream state is currently offline.",
      );
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        const unsubscribeFrame: WebSocketEvent = {
          type: "UNSUBSCRIBE",
          payload: { roomId, userId },
        };
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(unsubscribeFrame));
        }
        socketRef.current.close();
      }
    };
  }, [connect, roomId, userId]);

  return { isConnected, emitEvent };
}
