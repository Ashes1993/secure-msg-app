"use client";

import { getRooms } from "@/actions/rooms";
import { useQuery } from "@tanstack/react-query";
import { decryptMessage } from "@/lib/crypto";
import { useAuthStore } from "@/stores/useAuthStore";

export function useRooms() {
  const myPrivateKey = useAuthStore((state) => state.privateKey);

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

  return {
    rooms: rooms.data || [],
    isPending: rooms.isPending,
    error: rooms.error?.message || null,
  };
}
