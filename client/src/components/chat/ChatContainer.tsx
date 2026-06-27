"use client";

import { useUiStore } from "@/stores/useUiStore";
import { useMessages } from "@/hooks/useMessages";
import { Loader2 } from "lucide-react";

export default function ChatContainer() {
  const activeRoomId = useUiStore((state) => state.activeRoomId);

  const { messages, isLoading, error } = useMessages(activeRoomId);

  return (
    <div className="w-full flex flex-col">
      {!activeRoomId && (
        <div className="m-auto">Select a chat to see its messages.</div>
      )}

      {isLoading && <Loader2 className="w-10 h-10 m-auto animate-spin" />}

      {!isLoading && messages.length === 0 && (
        <div className="m-auto">There is no messages inside this chat.</div>
      )}

      {error && <div className="m-auto">{error}</div>}

      {messages.length > 0 && !error && (
        <div>
          {messages.map((message) => (
            <div key={message.id}>{message.content}</div>
          ))}
        </div>
      )}
    </div>
  );
}
