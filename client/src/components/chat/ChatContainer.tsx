"use client";

import { useMessages } from "@/hooks/useMessages";
import { useRooms } from "@/hooks/useRooms";
import CreateMessageForm from "./CreateMessageForm";
import ChatHeader from "./ChatHeader";
import ErrorState from "../ui/ErrorState";
import MessagesFeed from "./MessagesFeed";

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
  } = useMessages(roomId, currentUserId);
  const { rooms, isPending: isRoomsLoading } = useRooms();

  const activeRoom = rooms?.find((room) => room.id === roomId);
  const targetPublicKey = activeRoom?.targetUserPublicKey;

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
      <ChatHeader targetUserUsername={activeRoom?.targetUserUsername} />

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
        />
      </div>
    </div>
  );
}
