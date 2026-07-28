import { useState, useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { decryptMessage } from "@/lib/crypto";
import { MessageEntity } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { CornerUpLeft } from "lucide-react";

interface QuotedMessagePreviewProps {
  replyToId: string;
  roomId: string;
  currentUserId: string;
  isMe: boolean;
}

export function QuotedMessagePreview({
  replyToId,
  roomId,
  currentUserId,
  isMe,
}: QuotedMessagePreviewProps) {
  const queryClient = useQueryClient();
  const privateKey = useAuthStore((state) => state.privateKey);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);

  const rawCacheData = queryClient.getQueryData<unknown>(["messages", roomId]);

  let parentMsg: MessageEntity | undefined;

  if (Array.isArray(rawCacheData)) {
    parentMsg = rawCacheData.find((m: MessageEntity) => m.id === replyToId);
  } else if (
    rawCacheData &&
    typeof rawCacheData === "object" &&
    "pages" in rawCacheData
  ) {
    const infiniteData = rawCacheData as InfiniteData<unknown>;
    for (const page of infiniteData.pages) {
      const messagesList = Array.isArray(page)
        ? page
        : (page as { messages?: MessageEntity[]; data?: MessageEntity[] })
            ?.messages ||
          (page as { messages?: MessageEntity[]; data?: MessageEntity[] })
            ?.data;

      if (Array.isArray(messagesList)) {
        const found = messagesList.find(
          (m: MessageEntity) => m.id === replyToId,
        );
        if (found) {
          parentMsg = found;
          break;
        }
      }
    }
  }

  useEffect(() => {
    if (!parentMsg || !privateKey) return;

    let isMounted = true;
    const isSender = parentMsg.senderId === currentUserId;

    decryptMessage(parentMsg, privateKey, isSender)
      .then((text) => {
        if (isMounted) setDecryptedText(text);
      })
      .catch(() => {
        if (isMounted) setDecryptedText("Unable to decrypt quote");
      });

    return () => {
      isMounted = false;
    };
  }, [parentMsg, privateKey, currentUserId]);

  const displayText = !parentMsg
    ? "Original message unavailable"
    : (decryptedText ?? "Decrypting quote...");

  const handleScrollToParent = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const targetElement = document.getElementById(`message-${replyToId}`);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div
      onClick={handleScrollToParent}
      className={`mb-2 p-2 rounded-lg border-l-2 text-xs cursor-pointer transition-colors select-none ${
        isMe
          ? "bg-foreground/10 hover:bg-foreground/15 border-foreground/60 text-foreground"
          : "bg-accent/60 hover:bg-accent border-primary text-foreground"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <CornerUpLeft className="w-3 h-3 shrink-0 opacity-70" />
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
          Quoted Message
        </span>
      </div>
      <p
        className={`truncate font-normal leading-snug ${isMe ? "opacity-90" : "text-muted-foreground"}`}
      >
        {displayText}
      </p>
    </div>
  );
}
