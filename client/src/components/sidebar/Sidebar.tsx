"use client";

import { useParams } from "next/navigation";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { User, Settings } from "lucide-react";
import RoomList from "./RoomList";
import UserDiscovery from "./UserDiscovery";
import LogoutButton from "../auth/LogoutButton";

export default function Sidebar() {
  const params = useParams();
  const isChatActive = !!params.roomId;
  const user = useAuthenticatedUser().user;
  const { emitEvent } = useWebSocketContext();

  return (
    <aside
      className={`flex-col w-full md:w-90 h-full bg-background p-4 border border-border rounded-xl shadow-sm transition-micro duration-200 ${isChatActive ? "hidden md:flex" : "flex"}`}
    >
      <div className="flex items-center gap-3 p-2.5 bg-muted-foreground/[0.03] border border-border rounded-xl mb-4">
        <div className="w-9 h-9 rounded-full bg-muted-foreground/[0.1] flex items-center justify-center text-muted-foreground shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-foreground truncate">
            {user?.username}
          </h3>
          <p className="text-[10px] text-primary font-mono font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Keys Initialized
          </p>
        </div>
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/[0.05] rounded-lg transition-colors shrink-0"
          aria-label="Account Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <h1 className="font-bold text-xl mb-4 tracking-tight">Messaging App</h1>

      {/* Search section */}
      <UserDiscovery emitEvent={emitEvent} />

      {/* Conversations */}
      <RoomList />

      {/* Logout */}
      <div className="mt-auto pt-4 border-t border-border flex justify-center w-full ">
        <LogoutButton />
      </div>
    </aside>
  );
}
