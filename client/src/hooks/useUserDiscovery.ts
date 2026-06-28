"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser } from "@/actions/users";
import { createRoom } from "@/actions/room";

export function useUserDiscovery(searchQuery: string) {
  const queryClient = useQueryClient();

  const userSearchQuery = useQuery({
    queryKey: ["users", searchQuery],

    queryFn: async () => {
      const response = await getUser(searchQuery);
      if (!response.success) {
        throw new Error(response.error || "Failed to discover users.");
      }

      return response.data;
    },

    enabled: searchQuery.trim().length > 0,
  });

  const roomCreationMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await createRoom(targetUserId);

      if (!response.success) {
        throw new Error(response.error || "Failled to establish chat channel.");
      }

      return response.data;
    },

    onSuccess: async (roomPayload) => {
      if (roomPayload?.id) {
        await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      }
    },
  });

  return {
    users: userSearchQuery.data || [],
    isSearching: userSearchQuery.isPending,
    searchError: userSearchQuery.error?.message || null,

    createConversation: roomCreationMutation.mutate,
    isCreatingRoom: roomCreationMutation.isPending,
    creationError: roomCreationMutation.error?.message || null,
  };
}
