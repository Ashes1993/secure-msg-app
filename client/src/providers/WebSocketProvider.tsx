"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { WebSocketEvent } from "@/types/chat";

interface WebSocketContextType {
  isConnected: boolean;
  emitEvent: (event: WebSocketEvent) => void;
  subscribeToEvents: (listener: (event: WebSocketEvent) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(event: WebSocketEvent) => void>>(new Set());

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

  const subscribeToEvents = useCallback(
    (listener: (event: WebSocketEvent) => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [],
  );

  const emitEvent = useCallback((event: WebSocketEvent) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    } else {
      console.warn(
        "[WebSocket:WebSocketProvider] Cannot send frame: Socket is offline.",
      );
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    if (
      socketRef.current?.readyState === WebSocket.CONNECTING ||
      socketRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("[WebSocket:WebSocketProvider] Stream pipeline connected.");

      const subscribeFrame: WebSocketEvent = {
        type: "SUBSCRIBE",
        payload: { userId },
      };
      ws.send(JSON.stringify(subscribeFrame));
    };

    ws.onmessage = (messageEvent) => {
      try {
        const parsedData = JSON.parse(messageEvent.data) as WebSocketEvent;

        listenersRef.current.forEach((listener) => listener(parsedData));
      } catch (err) {
        console.error(
          "[WebSocket:WebSocketProvider] Failed to decode incoming frame:",
          err,
        );
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      console.log(
        "[WebSocket:WebSocketProvider] Stream pipeline disconnected.",
      );
    };

    ws.onerror = (err) => {
      console.error("[WebSocket:WebSocketProvider] Pipeline exception:", err);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [userId, wsUrl]);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, emitEvent, subscribeToEvents }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "[WebSocket:useWebSocketContext] useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
}
