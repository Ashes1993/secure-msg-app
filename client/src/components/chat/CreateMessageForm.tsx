"use client";

import { useCreateMessage } from "@/hooks/useCreateMessage";
import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";
import { WebSocketEvent } from "@/hooks/useWebSocket";

interface CreateMessageFormProps {
  roomId: string;
  targetPublicKey: string | undefined;
  isDisabled: boolean;
  currentUserId: string;
  emitEvent: (event: WebSocketEvent) => void;
}

export default function CreateMessageForm({
  roomId,
  targetPublicKey,
  isDisabled,
  currentUserId,
  emitEvent,
}: CreateMessageFormProps) {
  const [message, setMessage] = useState<string>("");
  const { messageCreation, isPending, error } = useCreateMessage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const sendMessage = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim() || isPending) return;

    if (!targetPublicKey) return;

    messageCreation(
      {
        roomId,
        messageText: message.trim(),
        targetPublicKey,
      },
      {
        onSuccess: (newMessageData) => {
          console.log("=== [TRACE 1: ORIGIN EMIT] ===");
          console.log("Database response (newMessageData):", newMessageData);
          setMessage("");
          if (textareaRef.current) textareaRef.current.style.height = "auto";

          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

          if (isTypingRef.current) {
            isTypingRef.current = false;
            emitEvent({
              type: "TYPING_STATUS",
              payload: { roomId, userId: currentUserId, isTyping: false },
            });
          }

          if (!newMessageData) {
            console.warn(
              "!!! [TRACE 1 ALERT] !!! Message execution halted: newMessageData is empty.",
            );
            return;
          }

          const outboundPayload = {
            type: "ENCRYPTED_MESSAGE" as const,
            payload: {
              id: newMessageData.id,
              roomId,
              senderId: newMessageData.senderId,
              encryptedContent: newMessageData.encryptedContent,
              iv: newMessageData.iv,
              senderEncryptedKey: newMessageData.senderEncryptedKey,
              recipientEncryptedKey: newMessageData.recipientEncryptedKey,
              createdAt: newMessageData.createdAt,
            },
          };

          console.log(
            "Dispatched payload contract over emitEvent:",
            outboundPayload,
          );
          emitEvent(outboundPayload);
        },
        onError: (err) => {
          console.error(
            "[Component:CreateMessageForm] Form level handling caught creation error:",
            err,
          );
        },
      },
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={sendMessage}
      className="w-full flex items-end gap-2.5 bg-muted-foreground/[0.03] border border-border rounded-xl p-2 transition-micro focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        name="message"
        id="message"
        value={message}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setMessage(event.target.value);

          if (!isTypingRef.current && event.target.value.trim().length > 0) {
            isTypingRef.current = true;
            emitEvent({
              type: "TYPING_STATUS",
              payload: {
                roomId,
                userId: currentUserId,
                isTyping: true,
              },
            });
          }

          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

          typingTimeoutRef.current = setTimeout(() => {
            if (isTypingRef.current) {
              isTypingRef.current = false;
              emitEvent({
                type: "TYPING_STATUS",
                payload: { roomId, userId: currentUserId, isTyping: false },
              });
            }
          }, 2000);
        }}
        placeholder="Type a secure message..."
        disabled={isPending || isDisabled}
        className="flex-1 py-2 px-3 resize-none min-h-[40px] max-h-[120px] bg-transparent text-foreground text-xs placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 font-normal leading-relaxed custom-scrollbar"
      />
      <button
        type="submit"
        disabled={isPending || !message.trim()}
        className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
        aria-label="Dispatch secure frame payload"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <SendHorizontal className="w-4 h-4" />
        )}
      </button>

      {error && (
        <p className="text-xs text-destructive pl-2 font-medium absolute m-auto h-full">
          {error}
        </p>
      )}
    </form>
  );
}
