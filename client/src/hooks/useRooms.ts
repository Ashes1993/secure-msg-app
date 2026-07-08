"use client";

import { getRooms, createRoom } from "@/actions/rooms";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { decryptMessage } from "@/lib/crypto";
import { useAuthStore } from "@/stores/useAuthStore";

export function useRooms() {
  const myPrivateKey = useAuthStore((state) => state.privateKey);
  const queryClient = useQueryClient();

  const rooms = useQuery({
    queryKey: ["rooms"],

    queryFn: async () => {
      if (!myPrivateKey) {
        throw new Error(
          "Private key unverified or missing. Please sign in again.",
        );
      }

      const response = await getRooms();
      if (!response.success) {
        throw new Error(
          response.error ||
            "Failed to retrieve rooms. Please refresh the page.",
        );
      }

      const rawRooms = response.data;

      if (!rawRooms) {
        throw new Error("Failed to retrieve rooms. Please refresh the page.");
      }

      return Promise.all(
        rawRooms.map(async (room) => {
          if (!room.lastMessageSenderId) return room;

          const {
            lastMessage,
            lastMessageSenderId,
            lastMessageIv,
            lastMessageSenderEncryptedKey,
            lastMessageRecipientEncryptedKey,
            currentUserId,
          } = room;

          if (
            !lastMessageIv ||
            !lastMessageSenderEncryptedKey ||
            !lastMessageRecipientEncryptedKey
          ) {
            return {
              ...room,
              lastMessage: "Unable to load message.",
            };
          }
          try {
            const isSender = lastMessageSenderId === currentUserId;

            const payload = {
              encryptedContent: lastMessage,
              senderEncryptedKey: lastMessageSenderEncryptedKey,
              recipientEncryptedKey: lastMessageRecipientEncryptedKey,
              iv: lastMessageIv,
            };

            const plaintext = await decryptMessage(
              payload,
              myPrivateKey,
              isSender,
            );

            return { ...room, lastMessage: plaintext };
          } catch {
            return { ...room, lastMessage: "Unable to load message." };
          }
        }),
      );
    },
    enabled: !!myPrivateKey,
  });

  const roomCreationMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await createRoom(targetUserId);
      if (!response.success) {
        throw new Error(
          response.error || "Could not establish secure communication channel.",
        );
      }
      return response.data;
    },
    onError: (error) => {
      console.error(
        "[Hook:useRooms] Room creation mutation rejected:",
        error.message,
      );
    },
    onSuccess: async (roomPayload) => {
      if (roomPayload?.userRoom.id) {
        await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      }
    },
  });

  return {
    rooms: rooms.data || [],
    isPending: rooms.isPending,
    error: rooms.error?.message || null,

    createConversation: roomCreationMutation.mutateAsync,
    isCreatingRoom: roomCreationMutation.isPending,
    creationError: roomCreationMutation.error?.message || null,
  };
}
