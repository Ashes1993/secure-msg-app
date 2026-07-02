"use client";

import { useRef, useEffect } from "react";
import { Loader2, MessageSquareOff } from "lucide-react";
import ErrorState from "../ui/ErrorState";
import { MessageEntity } from "@/types/chat";

interface MessageFeedProps {
  messages: MessageEntity[];
  isLoading: boolean;
  error: string | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRoomsLoading: boolean;
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

export default function MessagesFeed({
  messages,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isRoomsLoading,
  currentUserId,
}: MessageFeedProps) {
  const topObserverRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const prevLastMessageId = useRef<string | null>(null);

  useEffect(() => {
    const target = topObserverRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto scrolling on new message and base position on mount
  useEffect(() => {
    if (messages.length === 0) return;

    const currentLastMessage = messages[messages.length - 1];
    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
      prevLastMessageId.current = currentLastMessage?.id ?? null;
      return;
    }
    const isNewMessageAdded =
      currentLastMessage?.id !== prevLastMessageId.current;

    if (isNewMessageAdded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLastMessageId.current = currentLastMessage?.id ?? null;
  }, [messages]);

  return (
    <>
      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-muted-foreground/[0.01]">
          <div className="h-full w-full flex flex-col items-center justify-center gap-2.5 animate-fade-in">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium tracking-tight animate-bounce">
              Decrypting messages...
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && <ErrorState title="Retrieve Message Failure" message={error} />}

      {/* Empty state */}
      {!isLoading && !isRoomsLoading && !error && messages.length === 0 && (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="p-4 bg-muted-foreground/[0.03] border border-border text-muted-foreground rounded-2xl mb-3">
            <MessageSquareOff className="w-6 h-6 text-muted-foreground/70" />
          </div>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            This cryptographic channel is empty. Send a message to initiate data
            transmission.
          </p>
        </div>
      )}

      {/* Chat messages layout */}
      {!isLoading && !isRoomsLoading && !error && messages.length > 0 && (
        <div className=" overflow-y-auto min-h-0 p-4 space-y-4 bg-muted-foreground/[0.01] animate-slide-up">
          {/* Invisible anchor for upward scrolling detection */}
          <div
            ref={topObserverRef}
            className="w-full h-2 flex items-center justify-center py-2"
          >
            {isFetchingNextPage && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          {messages.map((message) => {
            const isMe = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex w-full group ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm rounded-2xl shadow-sm transition-micro break-words ${isMe ? "bg-primary text-foreground rounded-br-sm" : "bg-muted-foreground/[0.05] border border-border text-foreground rounded-bl-sm"}`}
                >
                  <p className="leading-relaxed font-normal selection:bg-background/20">
                    {message.encryptedContent}
                  </p>

                  {/* Metadata Timestamp Footprints */}
                  <div
                    className={`w-full flex mt-1.5 opacity-60 text-[9px] font-mono ${isMe ? "justify-end text-primary-foreground/80" : "justify-start text-muted-foreground"}`}
                  >
                    {formatMessageTimestamp(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      )}
    </>
  );
}
