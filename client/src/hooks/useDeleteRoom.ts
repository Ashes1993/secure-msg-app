"use client";

import { deleteRoom } from "@/actions/rooms";
import { RoomEntity } from "@/types/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  const deleteRoomMutation = useMutation({
    mutationFn: async ({ roomId }: { roomId: string }) => {
      const response = await deleteRoom(roomId);
      if (!response.success) {
        throw new Error(
          response.error ||
            "Unable to delete the room due to a server error. Please try again shortly.",
        );
      }
      return response;
    },
    onMutate: async ({ roomId }) => {
      await queryClient.cancelQueries({ queryKey: ["rooms"] });

      const previousRooms = queryClient.getQueryData<RoomEntity[]>(["rooms"]);

      queryClient.setQueryData<RoomEntity[]>(["rooms"], (oldRooms) => {
        if (!oldRooms) return [];
        return oldRooms.filter((room) => room.id !== roomId);
      });

      return { previousRooms };
    },
    onSuccess: (_data, { roomId }) => {
      queryClient.removeQueries({ queryKey: ["messages", roomId] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(["rooms"], context.previousRooms);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return {
    deleteRoomMutateAsync: deleteRoomMutation.mutateAsync,
    isPending: deleteRoomMutation.isPending,
    error: deleteRoomMutation.error?.message,
  };
}
