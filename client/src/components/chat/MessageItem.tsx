"use client";

import { useState, useEffect } from "react";
import { decryptMessage } from "@/lib/crypto";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageEntity } from "@/types/chat";
import { Check, CheckCheck } from "lucide-react";

interface MessageItemProps {
  message: MessageEntity;
  currentUserId: string;
}

// Helper function to sanitize the message data based on recency
function formatMessageTimestamp(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) return timeString;
  if (isYesterday) return `Yesterday, ${timeString}`;

  const dateString = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return `${dateString}, ${timeString}`;
}

export function MessageItem({ message, currentUserId }: MessageItemProps) {
  const privateKey = useAuthStore((state) => state.privateKey);
  const [content, setContent] = useState<string>("Decrypting data block...");
  const [isError, setIsError] = useState<boolean>(false);

  const isMe = message.senderId === currentUserId;

  useEffect(() => {
    let isMounted = true;

    async function decryptPayload() {
      if (!privateKey) return;
      try {
        const isSender = message.senderId === currentUserId;

        const plaintext = await decryptMessage(message, privateKey, isSender);

        if (isMounted) {
          setContent(plaintext);
        }
      } catch (err) {
        console.error(
          `[Messages:MessageItem] Failed to decrypt item ${message.id}`,
          err,
        );
        if (isMounted) {
          setContent(
            "Data encryption failed. integrity compromise or key mismatch.",
          );
          setIsError(true);
        }
      }
    }

    decryptPayload();

    return () => {
      isMounted = false;
    };
  }, [message, privateKey, currentUserId]);

  return (
    <div
      className={`flex w-full group ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] px-4 py-3 text-sm rounded-2xl shadow-sm transition-micro break-words ${
          isMe
            ? "bg-primary text-foreground rounded-br-sm"
            : "bg-muted-foreground/[0.05] border border-border text-foreground rounded-bl-sm"
        }`}
      >
        <p
          className={`leading-relaxed font-normal selection:bg-background/20 ${isError ? "text-destructive font-mono text-xs" : ""}`}
        >
          {content}
        </p>

        {/* Metadata Timestamp */}
        <div
          className={`w-full flex mt-1.5 opacity-60 text-[9px] font-mono ${
            isMe
              ? "justify-end text-primary-foreground/80"
              : "justify-start text-muted-foreground"
          }`}
        >
          <span>{formatMessageTimestamp(message.createdAt)}</span>
          {isMe && (
            <span className="ml-1 flex items-center">
              {message.isRead ? (
                <CheckCheck className="w-3 h-3 text-black stroke-[2.5]" />
              ) : (
                <Check className="w-3 h-3 text-black stroke-[2.5]" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
