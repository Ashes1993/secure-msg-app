"use client";

import { useEffect, useCallback } from "react";
import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { markAsRead } from "@/actions/rooms";
import { useAuthenticatedUser } from "./useAuthenticatedUser";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { MessageEntity, RoomEntity, WebSocketEvent } from "@/types/chat";

export function useMarkAsRead(roomId: string, recipientId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthenticatedUser();
  const currentUserId = currentUser?.user?.id;
  const { emitEvent, subscribeToEvents } = useWebSocketContext();

  // Outgoing server action
  const { mutate: executeMarkAsRead } = useMutation({
    mutationFn: async (lastReadMessageId?: string) => {
      return await markAsRead(roomId, lastReadMessageId);
    },
    onSuccess: (response, lastReadMessageId) => {
      if (!response.success || !currentUserId) {
        throw new Error(
          response.error || "Failed to update the database. Try again shortly.",
        );
      }

      emitEvent({
        type: "MARK_READ",
        payload: {
          roomId,
          readerId: currentUserId,
          lastReadMessageId: lastReadMessageId ?? "",
          recipientId,
        },
      });

      queryClient.setQueryData(["rooms"], (oldRooms: RoomEntity[]) => {
        if (!oldRooms) return oldRooms;
        return oldRooms.map((room: RoomEntity) => {
          if (room.id === roomId) {
            return { ...room, unreadCount: 0 };
          }
          return room;
        });
      });
    },
    onError: (err) => {
      console.error(
        "[hooks:useMarkAsRead] Failed to mark room as read on server:",
        err,
      );
    },
  });

  const markRoomAsRead = useCallback(
    (lastReadMessageId?: string) => {
      if (!roomId) return;
      executeMarkAsRead(lastReadMessageId);
    },
    [roomId, executeMarkAsRead],
  );

  // Incoming WebSocket listener
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToEvents((event: WebSocketEvent) => {
      if (event.type !== "MARK_READ" || event.payload.roomId !== roomId) {
        return;
      }

      const { readerId } = event.payload;

      if (readerId === currentUserId) return;

      queryClient.setQueryData<InfiniteData<MessageEntity[]>>(
        ["messages", roomId],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((msg) => {
                if (msg.senderId === currentUserId) {
                  return { ...msg, isRead: true };
                }
                return msg;
              }),
            ),
          };
        },
      );
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, currentUserId, subscribeToEvents, queryClient]);

  return { markRoomAsRead };
}
