"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages } from "@/actions/messages";
import { decryptMessage } from "@/lib/crypto";
import { useAuthStore } from "@/stores/useAuthStore";

export function useMessages(
  roomId: string | null | undefined,
  currentUserId: string,
) {
  const privateKey = useAuthStore((state) => state.privateKey);

  const roomMessages = useInfiniteQuery({
    queryKey: ["messages", roomId],

    queryFn: async ({ pageParam }) => {
      if (!roomId) throw new Error("Failed to get room ID. Refresh the page.");

      if (!privateKey)
        throw new Error("Private key missing. Try to sign in again.");

      const response = await getMessages(roomId, pageParam ?? undefined, 20);
      if (!response.success || !response.data) {
        throw new Error(
          response.error || "Failed to retrieve messages. Try again shortly.",
        );
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
          } catch (err) {
            console.error(
              "[Hooks:useMessages] Failed to decrypt individual block message node:",
              err,
            );

            return {
              ...message,
              encryptedContent: "Unable to load the messages.",
            };
          }
        }),
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 20) return undefined;
      return lastPage[lastPage.length - 1]?.id ?? undefined;
    },
    enabled: !!roomId && !!privateKey,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const messages = roomMessages.data
    ? roomMessages.data.pages.flatMap((page) => page).reverse()
    : [];

  return {
    messages,
    isLoading: roomMessages.isLoading,
    error: roomMessages.error?.message || null,
    fetchNextPage: roomMessages.fetchNextPage,
    hasNextPage: roomMessages.hasNextPage,
    isFetchingNextPage: roomMessages.isFetchingNextPage,
  };
}
