"use client";

import { useRooms } from "@/hooks/useRooms";
import { Loader2 } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";

export default function RoomList() {
  const setActiveRoomId = useUiStore((state) => state.setActiveRoomId);
  const { rooms, isLoading, error } = useRooms();

  return (
    <div className="mt-4">
      {!isLoading && rooms.length === 0 && <div>No rooms</div>}

      {isLoading && <Loader2 className="w-4 h-4 m-auto animate-spin" />}

      {!isLoading && error && <div>{error}</div>}

      {!isLoading && rooms.length > 0 && (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <div
              className="bg-card border border-border p-2 rounded-xl"
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
            >
              <h3 className="text-sm font-bold">{room.targetUserUsername}</h3>
              <p className="text-xs">{room.lastMessage}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
