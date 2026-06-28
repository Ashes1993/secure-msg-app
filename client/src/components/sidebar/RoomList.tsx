"use client";

import { useRooms } from "@/hooks/useRooms";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function RoomList() {
  const { rooms, isLoading, error } = useRooms();
  const { roomId } = useParams();

  return (
    <div className="mt-4 overflow-y-auto">
      {!isLoading && rooms.length === 0 && <div>No rooms</div>}

      {isLoading && <Loader2 className="w-4 h-4 m-auto animate-spin" />}

      {!isLoading && error && <div>{error}</div>}

      {!isLoading && rooms.length > 0 && (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => {
            const isActive = room.id === roomId;

            return (
              <Link
                className={`bg-card border border-border p-2 rounded-xl ${isActive && "scale-[0.98] bg-primary/50 border-primary"}`}
                key={room.id}
                href={`/chat/${room.id}`}
              >
                <h3 className="text-sm font-bold">{room.targetUserUsername}</h3>
                <p className="text-xs">{room.lastMessage}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
