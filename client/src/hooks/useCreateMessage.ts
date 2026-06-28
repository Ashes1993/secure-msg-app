"use client";

import { createMessage } from "@/actions/messages";
import { encryptMessage } from "@/lib/crypto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";

interface CreateMessageVariables {
  roomId: string;
  messageText: string;
  targetPublicKey: string;
}

export function useCreateMessage() {
  const currentUserPublicKey = useAuthStore((state) => state.publicKey);
  const queryClient = useQueryClient();

  const messageCreationMutation = useMutation({
    mutationFn: async ({
      roomId,
      messageText,
      targetPublicKey,
    }: CreateMessageVariables) => {
      if (!currentUserPublicKey) {
        throw new Error("No authenticated public key found in local state.");
      }

      const {
        encryptedContent,
        iv,
        senderEncryptedKey,
        recipientEncryptedKey,
      } = await encryptMessage(
        messageText,
        currentUserPublicKey,
        targetPublicKey,
      );

      const response = await createMessage(
        roomId,
        encryptedContent,
        iv,
        senderEncryptedKey,
        recipientEncryptedKey,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to create the message");
      }

      return response.data;
    },
    onSuccess: async (messagePayload, variables) => {
      if (messagePayload?.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["messages", variables.roomId],
          }),
          queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        ]);
      }
    },
  });

  return {
    messageCreation: messageCreationMutation.mutate,
    isLoading: messageCreationMutation.isPending,
    error: messageCreationMutation.error?.message || null,
  };
}
