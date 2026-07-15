"use client";

import { useEffect } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useRooms } from "@/hooks/useRooms";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useChatStore } from "@/stores/useChatStore";
import CreateMessageForm from "./CreateMessageForm";
import ChatHeader from "./ChatHeader";
import ErrorState from "../ui/ErrorState";
import MessagesFeed from "./MessagesFeed";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { MessageEntity, WebSocketEvent } from "@/types/chat";
import { useMarkAsRead } from "@/hooks/useMarkAsRead";

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
  const targetId = activeRoom?.targetUserId;

  const queryClient = useQueryClient();

  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);
  const setUserOnlineStatus = useChatStore(
    (state) => state.setUserOnlineStatus,
  );

  const isTargetOnline = useChatStore((state) =>
    targetId ? state.onlineUsers.includes(targetId) : false,
  );

  const { emitEvent, isConnected, subscribeToEvents } = useWebSocketContext();

  const { markRoomAsRead } = useMarkAsRead(roomId, targetId);

  // Subscribe to room when ChatContainer mounts
  useEffect(() => {
    if (!isConnected) return;

    emitEvent({
      type: "SUBSCRIBE",
      payload: { roomId, userId: currentUserId, targetUserId: targetId },
    });

    return () => {
      emitEvent({
        type: "UNSUBSCRIBE",
        payload: { roomId, userId: currentUserId },
      });
    };
  }, [roomId, currentUserId, targetId, emitEvent, isConnected]);

  // Listen for global WebSocket events
  useEffect(() => {
    const unsubscribe = subscribeToEvents((wsEvent: WebSocketEvent) => {
      if (wsEvent.type === "ENCRYPTED_MESSAGE") {
        const { roomId: msgRoomId, message } = wsEvent.payload;

        if (msgRoomId !== roomId) return;

        queryClient.setQueryData<InfiniteData<MessageEntity[]>>(
          ["messages", roomId],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page, index: number) => {
                if (index === 0) {
                  return [message, ...page];
                }
                return page;
              }),
            };
          },
        );
      }

      if (
        wsEvent.type === "TYPING_STATUS" &&
        wsEvent.payload.roomId === roomId
      ) {
        if (wsEvent.payload.isTyping) {
          setTypingUser(wsEvent.payload.userId);
        } else {
          removeTypingUser(wsEvent.payload.userId);
        }
      }

      if (wsEvent.type === "USER_STATUS_CHANGE") {
        const { userId, isOnline } = wsEvent.payload;
        setUserOnlineStatus(userId, isOnline);
      }
    });

    return () => unsubscribe();
  }, [
    roomId,
    queryClient,
    setTypingUser,
    removeTypingUser,
    setUserOnlineStatus,
    subscribeToEvents,
  ]);

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
        isConnected={isTargetOnline}
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
        onMarkAsRead={markRoomAsRead}
      />

      {/* Create message form */}
      <div className="p-4 mt-auto border-t border-border bg-background shrink-0">
        <CreateMessageForm
          roomId={roomId}
          targetPublicKey={targetPublicKey}
          targetId={targetId}
          isDisabled={isRoomsLoading || !targetPublicKey}
          currentUserId={currentUserId}
          emitEvent={emitEvent}
        />
      </div>
    </div>
  );
}
