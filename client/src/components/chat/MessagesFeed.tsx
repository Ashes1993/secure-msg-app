"use client";

import { useRef, useEffect } from "react";
import { Loader2, MessageSquareOff } from "lucide-react";
import { MessageEntity } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";
import { MessageItem } from "./MessageItem";
import ErrorState from "../ui/ErrorState";
import TypingIndicatorBubble from "./TypingIndicatorBubble";

interface MessageFeedProps {
  messages: MessageEntity[];
  isLoading: boolean;
  error: string | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRoomsLoading: boolean;
  currentUserId: string;
  onMarkAsRead?: (lastMessageId: string) => void;
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
  onMarkAsRead,
}: MessageFeedProps) {
  const topObserverRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const prevLastMessageId = useRef<string | null>(null);
  const lastMarkedIdRef = useRef<string | null>(null);

  const isTargetTyping = useChatStore((state) =>
    state.typingUsers.some((id) => id !== currentUserId),
  );

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

  useEffect(() => {
    if (isTargetTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTargetTyping]);

  // Auto-trigger read status when new messages are displayed
  useEffect(() => {
    if (messages.length === 0 || !onMarkAsRead) return;

    const latestMessage = messages[messages.length - 1];
    const isIncoming = latestMessage.senderId !== currentUserId;

    if (isIncoming && lastMarkedIdRef.current !== latestMessage.id) {
      lastMarkedIdRef.current = latestMessage.id;
      onMarkAsRead(latestMessage.id);
    }
  }, [messages, currentUserId, onMarkAsRead]);

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
      {!isLoading &&
        !isRoomsLoading &&
        !error &&
        (messages.length > 0 || isTargetTyping) && (
          <div className=" overflow-y-auto min-h-0 h-full p-4 space-y-4 bg-muted-foreground/[0.01] animate-slide-up">
            {/* Invisible anchor for upward scrolling detection */}
            <div
              ref={topObserverRef}
              className="w-full h-2 flex items-center justify-center py-2"
            >
              {isFetchingNextPage && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
            </div>

            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}

            {isTargetTyping && <TypingIndicatorBubble />}

            <div ref={messagesEndRef} />
          </div>
        )}
    </>
  );
}
