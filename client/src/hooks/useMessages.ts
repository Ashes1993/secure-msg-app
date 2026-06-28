"use client";

import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/actions/messages";

export function useMessages(roomId: string | null | undefined) {
  const roomMessages = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      if (!roomId) throw new Error("No room ID provided.");
      const response = await getMessages(roomId);
      if (!response.success) {
        throw new Error(response.error || "Failed to get messages.");
      }

      return response.data;
    },
    enabled: !!roomId,
  });

  return {
    messages: roomMessages.data || [],
    isLoading: roomMessages.isLoading,
    error: roomMessages.error?.message || null,
  };
}
