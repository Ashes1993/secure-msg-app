"use client";

import { deleteMessage } from "@/actions/messages";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { MessageEntity } from "@/types/chat";

export function useDeleteMessage(roomId: string, currentUserId: string) {
  const { emitEvent } = useWebSocketContext();
  const queryClient = useQueryClient();

  const deleteMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      type,
    }: {
      messageId: string;
      type: "local" | "global";
    }) => {
      const response = await deleteMessage(messageId, type);

      if (!response.success) {
        throw new Error(
          response.error || "Failed to delete the message. Try again shortly.",
        );
      }
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
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((msg) => msg.id !== variables.messageId),
            ),
          };
        },
      );

      return { previousMessages };
    },

    onSuccess: (_data, variables) => {
      if (variables.type === "global") {
        emitEvent({
          type: "MESSAGE_DELETED",
          payload: {
            roomId,
            userId: currentUserId,
            messageId: variables.messageId,
          },
        });
      }
    },

    onError: (_error, _variables, context) => {
      if (!context?.previousMessages) {
        return;
      }

      queryClient.setQueryData(["messages", roomId], context.previousMessages);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
    },
  });

  return {
    deleteMessage: deleteMessageMutation.mutate,
  };
}
