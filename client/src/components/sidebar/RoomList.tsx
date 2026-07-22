"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { decryptMessage } from "@/lib/crypto";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";
import { useRooms } from "@/hooks/useRooms";
import { RoomEntity, WebSocketEvent } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader2, AlertCircle } from "lucide-react";
import RoomItem from "./RoomItem";

export default function RoomList() {
  const { rooms, isPending, error } = useRooms();
  const params = useParams();
  const queryClient = useQueryClient();
  const user = useAuthenticatedUser().user;
  const currentUserId = user?.id;
  const myPrivateKey = useAuthStore((state) => state.privateKey);
  const { subscribeToEvents } = useWebSocketContext();

  const activeRoomId = Array.isArray(params?.roomId)
    ? params.roomId[0]
    : params?.roomId;

  useEffect(() => {
    if (!activeRoomId) return;

    queryClient.setQueryData<RoomEntity[] | null>(["rooms"], (oldRooms) => {
      if (!oldRooms) return oldRooms;
      return oldRooms.map((room) => {
        if (String(room.id) === String(activeRoomId)) {
          return { ...room, unreadCount: 0 };
        }
        return room;
      });
    });
  }, [activeRoomId, queryClient]);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((wsEvent: WebSocketEvent) => {
      // Handle incoming room creation
      if (wsEvent.type === "ROOM_CREATED") {
        queryClient.setQueryData<RoomEntity[]>(["rooms"], (oldRooms) => {
          const newRoom = wsEvent.payload.room;
          if (!oldRooms) return [newRoom];
          if (oldRooms.some((r) => r.id === newRoom.id)) return oldRooms;
          return [newRoom, ...oldRooms];
        });
      }

      // Multi-tab syncing for read receiots
      if (wsEvent.type === "MARK_READ") {
        const { roomId, readerId } = wsEvent.payload;
        if (readerId === currentUserId) {
          queryClient.setQueryData<RoomEntity[] | null>(
            ["rooms"],
            (oldRooms) => {
              if (!oldRooms) return oldRooms;
              return oldRooms.map((room) => {
                if (room.id === roomId) {
                  return { ...room, unreadCount: 0 };
                }
                return room;
              });
            },
          );
        }
      }

      // Handle incoming real-time encrypted messages for sidebar preview updates
      if (wsEvent.type === "ENCRYPTED_MESSAGE") {
        const { roomId, message } = wsEvent.payload;

        const currentRooms = queryClient.getQueryData<RoomEntity[] | null>([
          "rooms",
        ]);
        const roomExists = currentRooms?.some((r) => r.id === roomId);

        if (!roomExists) {
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
          return;
        }

        (async () => {
          const {
            encryptedContent,
            senderEncryptedKey,
            recipientEncryptedKey,
            iv,
            senderId,
            createdAt,
          } = message;

          let plaintext = "New message received";
          if (myPrivateKey) {
            try {
              const isSender = senderId === currentUserId;
              plaintext = await decryptMessage(
                {
                  encryptedContent,
                  senderEncryptedKey,
                  recipientEncryptedKey,
                  iv,
                },
                myPrivateKey,
                isSender,
              );
            } catch {
              plaintext = "Unable to load message.";
            }
          }

          // Update TanStack Query cache for sidebar rooms
          queryClient.setQueryData<RoomEntity[] | null>(
            ["rooms"],
            (oldRooms) => {
              if (!oldRooms) {
                return oldRooms;
              }

              const targetIndex = oldRooms.findIndex((r) => r.id === roomId);

              if (targetIndex === -1) {
                return oldRooms;
              }

              const isCurrentlyActiveRoom =
                String(roomId) === String(activeRoomId);
              const shouldIncrementUnread =
                senderId !== currentUserId && !isCurrentlyActiveRoom;

              const updatedRoom: RoomEntity = {
                ...oldRooms[targetIndex],
                lastMessage: plaintext,
                lastMessageAt: createdAt,
                lastMessageSenderId: senderId,
                lastMessageIv: iv,
                lastMessageSenderEncryptedKey: senderEncryptedKey,
                lastMessageRecipientEncryptedKey: recipientEncryptedKey,
                unreadCount: shouldIncrementUnread
                  ? (oldRooms[targetIndex].unreadCount ?? 0) + 1
                  : 0,
              };

              // Re-order rooms array so the most recently updated room floats to the top
              const remainingRooms = oldRooms.filter((r) => r.id !== roomId);
              return [updatedRoom, ...remainingRooms];
            },
          );
        })();
      }
    });

    return () => unsubscribe();
  }, [
    queryClient,
    myPrivateKey,
    currentUserId,
    subscribeToEvents,
    activeRoomId,
  ]);

  return (
    <div className="mt-4 px-1 overflow-y-auto scrollbar-none">
      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="w-6 h-6 text-muted-forground animate-spin" />
          <span className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase animate-pulse">
            Syncing Channels...
          </span>
        </div>
      )}

      {/* Error state */}
      {!isPending && error && (
        <div className="flex items-center gap-2.5 p-3.5 mx-1 text-xs font medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive animate-bounce" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">Retrieval Error</span>
            <span className="text-muted-foreground leading-relaxed">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !error && rooms.length === 0 && (
        <div className="text-center py-12 px-2 border border-dashed border-border rounded-xl ">
          <h3 className="font-bold text-xs">No active conversations found.</h3>
          <p className="text-xs text-muted-foreground font-medium">
            Search for a user and start a conversation.
          </p>
        </div>
      )}

      {/* List of rooms */}
      {!isPending && !error && rooms.length > 0 && (
        <div className="flex flex-col gap-2 p-4">
          {rooms.map((room) => {
            const isActive = String(room.id) === String(activeRoomId);

            return <RoomItem key={room.id} room={room} isActive={isActive} />;
          })}
        </div>
      )}
    </div>
  );
}
