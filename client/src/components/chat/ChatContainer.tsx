"use client";

import { useCallback } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useRooms } from "@/hooks/useRooms";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatStore } from "@/stores/useChatStore";
import CreateMessageForm from "./CreateMessageForm";
import ChatHeader from "./ChatHeader";
import ErrorState from "../ui/ErrorState";
import MessagesFeed from "./MessagesFeed";
import { WebSocketEvent } from "@/hooks/useWebSocket";
import { MessageEntity } from "@/types/chat";

interface ChatContainerProps {
  roomId: string;
  currentUserId: string;
}

export default function ChatContainer({
  roomId,
  currentUserId,
}: ChatContainerProps) {
  const {
    messages,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(roomId);
  const { rooms, isPending: isRoomsLoading } = useRooms();
  const activeRoom = rooms?.find((room) => room.id === roomId);
  const targetPublicKey = activeRoom?.targetUserPublicKey;

  const queryClient = useQueryClient();

  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);

  const onMessageReceivedHandler = useCallback(
    (wsEvent: WebSocketEvent) => {
      if (wsEvent.type === "ENCRYPTED_MESSAGE") {
        console.log("=== [TRACE 5: STATE INGESTION] ===");
        console.log(
          "Inbound payload validated by state controller:",
          wsEvent.payload,
        );
        console.log(
          "Current Active Room ID context in component viewport:",
          roomId,
        );

        // Check if the payload room matches your active room state before executing the cache updater
        if (wsEvent.payload.roomId !== roomId) {
          console.warn(
            `!!! [TRACE 5 ALERT] !!! Cache update skipped: Payload Room ID (${wsEvent.payload.roomId}) does not match current viewport Room ID (${roomId})`,
          );
        }
      }

      switch (wsEvent.type) {
        case "ENCRYPTED_MESSAGE":
          queryClient.setQueryData<InfiniteData<MessageEntity[]>>(
            ["messages", roomId],
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page, index: number) => {
                  if (index === 0) {
                    return [wsEvent.payload as MessageEntity, ...page];
                  }
                  return page;
                }),
              };
            },
          );
          break;

        case "TYPING_STATUS":
          if (wsEvent.payload.isTyping) {
            setTypingUser(wsEvent.payload.userId);
          } else {
            removeTypingUser(wsEvent.payload.userId);
          }
          break;
      }
    },
    [queryClient, roomId, setTypingUser, removeTypingUser],
  );

  const { emitEvent, isConnected } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080",
    roomId,
    userId: currentUserId,
    onMessageReceived: onMessageReceivedHandler,
  });

  if (!targetPublicKey && !isLoading && !isRoomsLoading) {
    return (
      <ErrorState
        title="Handshake Failure"
        message="Unable to establish safe connection. Try again shortly."
      />
    );
  }

  return (
    <div className="w-full h-screen max-h-screen md:h-full md:max-h-full flex flex-col bg-background relative overflow-hidden min-h-0">
      {/* Header section */}
      <ChatHeader
        targetUserUsername={activeRoom?.targetUserUsername}
        targetUserId={activeRoom?.targetUserId}
        isConnected={isConnected}
      />

      {/* Messages section */}
      <MessagesFeed
        messages={messages}
        isLoading={isLoading}
        error={error}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isRoomsLoading={isRoomsLoading}
        currentUserId={currentUserId}
      />

      {/* Create message form */}
      <div className="p-4 mt-auto border-t border-border bg-background shrink-0">
        <CreateMessageForm
          roomId={roomId}
          targetPublicKey={targetPublicKey}
          isDisabled={isRoomsLoading || !targetPublicKey}
          currentUserId={currentUserId}
          emitEvent={emitEvent}
        />
      </div>
    </div>
  );
}
