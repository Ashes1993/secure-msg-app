"use client";

import { useRooms } from "@/hooks/useRooms";
import { Loader2, AlertCircle, User, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Helper function to clean up the message time
function formatChatTimestamp(dateInput: Date | string | null): string {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  const now = new Date();

  // Strip out time components to compare calendar days cleanly
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // Sent today -> Show only time
  if (date >= startOfToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Sent yesterday -> Show "Yesterday"
  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  // Older messages -> Show month, day, and year if it's a previous year
  const includeYear = date.getFullYear() !== now.getFullYear();
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(includeYear && { year: "numeric" }),
  });
}

export default function RoomList() {
  const { rooms, isPending, error } = useRooms();
  const params = useParams();

  const activeRoomId = Array.isArray(params?.roomId)
    ? params.roomId[0]
    : params?.roomId;

  return (
    <div className="mt-4 px-1 overflow-y-auto scrollbar-none">
      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="w-6 h-6 text-muted-forground animate-spin" />
          <span className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase animate-pulse">
            Syncing Channels...
          </span>
        </div>
      )}

      {/* Error state */}
      {!isPending && error && (
        <div className="flex items-center gap-2.5 p-3.5 mx-1 text-xs font medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive animate-bounce" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">Retrieval Error</span>
            <span className="text-muted-foreground leading-relaxed">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !error && rooms.length === 0 && (
        <div className="text-center py-12 px-2 border border-dashed border-border rounded-xl ">
          <h3 className="font-bold text-xs">No active conversations found.</h3>
          <p className="text-xs text-muted-foreground font-medium">
            Search for a user and start a conversation.
          </p>
        </div>
      )}

      {/* List of rooms */}
      {!isPending && !error && rooms.length > 0 && (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => {
            const isActive = String(room.id) === String(activeRoomId);
            const formattedTimestamp = formatChatTimestamp(room.lastMessageAt);

            return (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                className={`group relative flex gap-3 w-full p-3 border rounded-xl transition-micro select-none outline-none animate-popover ${isActive ? "bg-gradient-to-r from-primary/15 to-primary/5 border-primary/40 shadow-md shadow-primary/5 translate-x-1" : "bg-card hover:bg-accent/50 border-border hover:border-border/80 hover:translate-x-0.5"}`}
              >
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary transition-micro duration-300 ${isActive ? "opacity-100 scale-100" : "opacity-0 sccale-75 group-hover:opacity-40"}`}
                />

                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                      isActive
                        ? "bg-primary/20 border-primary/30 text-primay shadow-inner"
                        : "bg-card border-border text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                    }`}
                  >
                    <User className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isActive ? "bg-primary text-foreground border-background" : "bg-background text-muted-foreground border-border group-hover:border-border/80"}`}
                  >
                    {room.type === "DM" ? (
                      <Users className="w-2.5 h-2.5" />
                    ) : (
                      <MessageSquare className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span
                      className={`text-sm font-semibold tracking-tight truncate transition-colors duration-200 ${
                        isActive
                          ? "text-primary font-bold"
                          : "text-foreground group-hover:text-primary/90"
                      }`}
                    >
                      {room.targetUserUsername}
                    </span>
                    {formattedTimestamp && (
                      <span
                        className={`text-[8px] font-semibold tracking-tight whitespace-nowrap tabular-nums shrink-0 ${
                          isActive
                            ? "text-primary/80"
                            : "text-muted-foreground/70"
                        }`}
                      >
                        {formattedTimestamp}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs truncate font-medium max-w-[170px] transition-colors duration-200 ${
                      isActive
                        ? "text-foreground/80 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {room.lastMessage}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
