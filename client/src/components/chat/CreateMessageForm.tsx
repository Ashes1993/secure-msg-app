"use client";

import { useState, useRef, useEffect } from "react";
import { useCreateMessage } from "@/hooks/useCreateMessage";
import { useEditMessage } from "@/hooks/useEditMessage";
import { WebSocketEvent } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";
import { SendHorizontal, Loader2 } from "lucide-react";

interface CreateMessageFormProps {
  roomId: string;
  targetPublicKey: string | undefined;
  targetId: string | undefined;
  isDisabled: boolean;
  currentUserId: string;
  emitEvent: (event: WebSocketEvent) => void;
}

export function CreateMessageForm({
  roomId,
  targetPublicKey,
  targetId,
  isDisabled,
  currentUserId,
  emitEvent,
}: CreateMessageFormProps) {
  const [message, setMessage] = useState<string>("");
  const { messageCreation, isPending, error } = useCreateMessage();
  const {
    editMessageMutate,
    isPending: isEditPending,
    error: editError,
  } = useEditMessage(roomId, targetId ?? "");

  const editingMessage = useChatStore((state) => state.editingMessage);
  const setEditingMessage = useChatStore((state) => state.setEditingMessage);
  const [prevEditingId, setPrevEditingId] = useState<string | null>(null);
  const currentEditingId = editingMessage?.id ?? null;

  if (currentEditingId !== prevEditingId) {
    setPrevEditingId(currentEditingId);
    setMessage(editingMessage ? editingMessage.decryptedText : "");
  }

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

  // Listen to edit message state from the Zustand store
  useEffect(() => {
    if (editingMessage) {
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const sendMessage = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim() || isPending) return;

    if (!targetPublicKey) return;

    if (editingMessage === null) {
      messageCreation(
        {
          roomId,
          messageText: message.trim(),
          targetPublicKey,
        },
        {
          onSuccess: (newMessageData) => {
            setMessage("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";

            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);

            if (isTypingRef.current) {
              isTypingRef.current = false;
              emitEvent({
                type: "TYPING_STATUS",
                payload: { roomId, userId: currentUserId, isTyping: false },
              });
            }

            if (!newMessageData) {
              console.warn(
                "Message execution stopped: newMessageData is empty.",
              );
              return;
            }

            const outboundPayload = {
              type: "ENCRYPTED_MESSAGE" as const,
              payload: {
                roomId,
                recipientId: targetId,
                message: {
                  id: newMessageData.id,
                  senderId: newMessageData.senderId,
                  encryptedContent: newMessageData.encryptedContent,
                  iv: newMessageData.iv,
                  senderEncryptedKey: newMessageData.senderEncryptedKey,
                  recipientEncryptedKey: newMessageData.recipientEncryptedKey,
                  isEdited: newMessageData.isEdited,
                  createdAt: newMessageData.createdAt,
                  updatedAt: newMessageData.updatedAt,
                },
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
              "[Components:CreateMessageForm] Form level handling caught creation error:",
              err,
            );
          },
        },
      );
    } else {
      editMessageMutate({
        messageId: editingMessage.id,
        rawMessageText: message,
        targetPublicKey,
      });

      setEditingMessage(null);
      setMessage("");
    }
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
        disabled={Boolean(isPending || isDisabled)}
        suppressHydrationWarning={true}
        className="flex-1 py-2 px-3 resize-none min-h-[40px] max-h-[120px] bg-transparent text-foreground text-xs placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 font-normal leading-relaxed custom-scrollbar"
      />

      {/* Action Control Zone Container */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 1. Dynamic Context Indicator Badge */}
        {editingMessage && (
          <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg font-mono font-medium select-none self-center">
            EDIT MODE
          </span>
        )}

        {/* 2. Defensive Cancel Button */}
        {editingMessage && (
          <button
            type="button"
            onClick={() => setEditingMessage(null)}
            disabled={isEditPending}
            className="h-10 px-3 flex items-center justify-center border border-border text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground active:scale-[0.98] transition-all text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        {/* 3. Primary Dispatch/Save Action Button */}
        <button
          type="submit"
          disabled={isEditPending || !message.trim()}
          className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          aria-label="Dispatch secure frame payload"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive pl-2 font-medium absolute m-auto h-full">
          {error}
        </p>
      )}
      {editError && (
        <p className="text-xs text-destructive pl-2 font-medium absolute m-auto h-full">
          {editError}
        </p>
      )}
    </form>
  );
}
