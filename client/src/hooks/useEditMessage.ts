"use client";

import { encryptMessage } from "@/lib/crypto";
import { editMessage } from "@/actions/messages";
import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageEntity } from "@/types/chat";

export function useEditMessage(roomId: string, recipientId: string) {
  const queryClient = useQueryClient();
  const { emitEvent } = useWebSocketContext();
  const senderPublicKey = useAuthStore((state) => state.publicKey);

  const editMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      encryptedContent,
      iv,
      senderEncryptedKey,
      recipientEncryptedKey,
    }: {
      messageId: string;
      encryptedContent: string;
      iv: string;
      senderEncryptedKey: string;
      recipientEncryptedKey: string;
    }) => {
      const response = await editMessage(
        messageId,
        encryptedContent,
        iv,
        senderEncryptedKey,
        recipientEncryptedKey,
      );

      if (!response.success) {
        throw new Error(
          response.error ||
            "Unable to edit message due to a system failure. Please try again shortly.",
        );
      }

      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["messages", roomId] });

      const previousMessages = queryClient.getQueryData<
        InfiniteData<MessageEntity[]>
      >(["messages", roomId]);

      queryClient.setQueryData<InfiniteData<MessageEntity[]>>(
        ["messages", roomId],
        (oldData) => {
          if (!oldData) return oldData;
          const { messageId, ...cryptoPayload } = variables;

          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((msg) =>
                msg.id === messageId
                  ? { ...msg, ...cryptoPayload, isEdited: true }
                  : msg,
              ),
            ),
          };
        },
      );

      return { previousMessages };
    },
    onSuccess: (data) => {
      if (!data) return;
      emitEvent({
        type: "MESSAGE_EDITED",
        payload: {
          recipientId,
          roomId,
          message: data,
        },
      });
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousMessages) return;

      queryClient.setQueryData(["messages", roomId], context.previousMessages);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  // Custom async wrapper to allow both encrypting and optimistic update
  const editMessageMutate = async ({
    messageId,
    rawMessageText,
    targetPublicKey,
  }: {
    messageId: string;
    rawMessageText: string;
    targetPublicKey: string;
  }) => {
    if (!senderPublicKey) {
      throw new Error("Public key is missing. Please sign in again.");
    }

    const cryptoPayload = await encryptMessage(
      rawMessageText,
      senderPublicKey,
      targetPublicKey,
    );

    editMessageMutation.mutate({
      messageId,
      ...cryptoPayload,
    });
  };

  return {
    editMessageMutate,
    isPending: editMessageMutation.isPending,
    error: editMessageMutation.error?.message || null,
  };
}
