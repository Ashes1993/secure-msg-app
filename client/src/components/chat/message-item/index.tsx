"use client";

import { useState, useEffect } from "react";
import { decryptMessage } from "@/lib/crypto";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageEntity } from "@/types/chat";
import { Check, CheckCheck, CornerUpLeft, Pencil, Trash2 } from "lucide-react";
import { useDeleteMessage } from "@/hooks/useDeleteMessage";
import { DeleteFlowModal } from "./DeleteFlowModal";

interface MessageItemProps {
  message: MessageEntity;
  currentUserId: string;
  roomId: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export type DeleteStage =
  | "IDLE"
  | "SELECT_TYPE"
  | "CONFIRM_LOCAL"
  | "CONFIRM_GLOBAL";

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

const MENU_OPTIONS = [
  {
    title: "Reply",
    icon: CornerUpLeft,
    variant: "default",
  },
  {
    title: "Edit",
    icon: Pencil,
    variant: "default",
  },
  {
    title: "Delete",
    icon: Trash2,
    variant: "destructive",
  },
];

export function MessageItem({
  message,
  currentUserId,
  roomId,
  isMenuOpen,
  onToggleMenu,
}: MessageItemProps) {
  const privateKey = useAuthStore((state) => state.privateKey);
  const [content, setContent] = useState<string>("Decrypting data block...");
  const [isError, setIsError] = useState<boolean>(false);

  const { deleteMessage, isPending } = useDeleteMessage(roomId, currentUserId);
  const [deleteStage, setDeleteStage] = useState<DeleteStage>("IDLE");

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

  const handleInitialDeleteClick = () => {
    onToggleMenu();
    if (isMe) {
      setDeleteStage("SELECT_TYPE");
    } else {
      setDeleteStage("CONFIRM_LOCAL");
    }
  };

  const handleModalConfirm = (type: "local" | "global") => {
    if (deleteStage === "SELECT_TYPE") {
      if (type === "global") setDeleteStage("CONFIRM_GLOBAL");
      if (type === "local") setDeleteStage("CONFIRM_LOCAL");
      return;
    }

    deleteMessage(
      { messageId: message.id, type },
      {
        onSuccess: () => {
          setDeleteStage("IDLE");
        },
        onError: () => {
          setDeleteStage("IDLE");
        },
      },
    );
  };

  return (
    <div
      className={`flex w-full group ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
        className={`relative max-w-[60%] px-4 py-3 text-sm rounded-2xl shadow-sm transition-micro break-words ${
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

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute top-0 z-40 mx-2 w-[150px] flex flex-col items-stretch p-1.5 border border-border rounded-xl shadow-lg bg-popover text-popover-foreground animate-popover ${isMe ? "right-full" : "left-full"}`}
          >
            {MENU_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isDestructive = option.variant === "destructive";

              return (
                <button
                  key={option.title}
                  onClick={() => {
                    if (option.title === "Delete") {
                      handleInitialDeleteClick();
                    }
                    // Placeholder: Future hooks for reply / edit
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium rounded-lg transition-colors ${isDestructive ? "text-destructive hover:bg-destructive/10" : "text-foreground/90 hover:bg-accent hover:text-foreground"}`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${isDestructive ? "text-destructive" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span>{option.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DeleteFlowModal
        stage={deleteStage}
        onClose={() => setDeleteStage("IDLE")}
        onConfirm={handleModalConfirm}
        isPending={isPending}
      />
    </div>
  );
}
