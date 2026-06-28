"use client";

import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/actions/messages";
import { decryptMessage } from "@/lib/crypto";
import { useAuthStore } from "@/stores/useAuthStore";

export function useMessages(
  roomId: string | null | undefined,
  currentUserId: string,
) {
  const privateKey = useAuthStore((state) => state.privateKey);

  const roomMessages = useQuery({
    queryKey: ["messages", roomId, currentUserId],

    queryFn: async () => {
      if (!roomId) throw new Error("No room ID provided.");
      if (!privateKey)
        throw new Error(
          "Cryptographic context missing: Private key unverified.",
        );

      const response = await getMessages(roomId);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to get messages.");
      }

      return Promise.all(
        response.data.map(async (message) => {
          try {
            const isSender = message.senderId === currentUserId;

            const decryptedText = await decryptMessage(
              message,
              privateKey,
              isSender,
            );

            return {
              ...message,
              encryptedContent: decryptedText,
            };
          } catch (cryptoError) {
            console.error(
              "Failed to decrypt individual block message node:",
              cryptoError,
            );

            return {
              ...message,
              encryptedContent:
                "⚠️ [Decryption Failure: Unable to authenticate message signature]",
            };
          }
        }),
      );
    },
    enabled: !!roomId && !!privateKey,
  });

  return {
    messages: roomMessages.data || [],
    isLoading: roomMessages.isLoading,
    error: roomMessages.error?.message || null,
  };
}
