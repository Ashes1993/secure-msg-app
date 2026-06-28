"use client";

import { useMessages } from "@/hooks/useMessages";
import { Loader2 } from "lucide-react";

interface ChatContainerProps {
  roomId: string;
}

export default function ChatContainer({ roomId }: ChatContainerProps) {
  const { messages, isLoading, error } = useMessages(roomId);

  if (!roomId) {
    return (
      <div className="w-full flex flex-col h-full">
        <div className="m-auto text-muted-foreground">
          Select a chat to see its messages.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      {/* Loading Evaluation State */}
      {isLoading && (
        <div className="flex m-auto items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">
            Decrypting ledger...
          </span>
        </div>
      )}

      {/* Error Evaluation State */}
      {error && (
        <div className="m-auto text-destructive bg-destructive/10 px-4 py-2 rounded-md border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Empty Conversation Evaluation State */}
      {!isLoading && !error && (!messages || messages.length === 0) && (
        <div className="m-auto text-muted-foreground text-sm">
          This conversation is completely empty. Secure a message to start.
        </div>
      )}

      {/* Valid Data Map State */}
      {!isLoading && !error && messages && messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="p-3 bg-card rounded-lg border text-card-foreground max-w-md font-mono text-xs break-all"
            >
              {/* Temporarily displaying the raw encrypted content block */}
              {message.encryptedContent}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
