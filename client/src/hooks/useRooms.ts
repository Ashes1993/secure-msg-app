"use client";

import { getRooms } from "@/actions/room";
import { useQuery } from "@tanstack/react-query";

export function useRooms() {
  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await getRooms();
      if (!response.success) {
        throw new Error(response.error || "Failed to retrieve rooms");
      }

      return response.data;
    },
  });

  return {
    rooms: rooms.data || [],
    isLoading: rooms.isLoading,
    error: rooms.error?.message || null,
  };
}
