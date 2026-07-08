"use client";

import { useParams } from "next/navigation";
import { User, Settings } from "lucide-react";
import RoomList from "./RoomList";
import UserDiscovery from "./UserDiscovery";
import LogoutButton from "../auth/LogoutButton";
import { useAuthenticatedUser } from "@/hooks/useAuthenticatedUser";
import { useWebSocket, WebSocketEvent } from "@/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { RoomEntity } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { decryptMessage } from "@/lib/crypto";
import { ActionResponse } from "@/types/actions";

export default function Sidebar() {
  const params = useParams();
  const queryClient = useQueryClient();

  const isChatActive = !!params.roomId;
  const user = useAuthenticatedUser().user;
  const myPrivateKey = useAuthStore((state) => state.privateKey);

  const currentUserId = user?.id;

  const onGlobalEventReceived = useCallback(
    (wsEvent: WebSocketEvent) => {
      // Handle incoming room creation
      if (wsEvent.type === "ROOM_CREATED") {
        queryClient.setQueryData<RoomEntity[]>(["rooms"], (oldRooms = []) => {
          if (oldRooms.some((room) => room.id === wsEvent.payload.room.id)) {
            return oldRooms;
          }
          return [wsEvent.payload.room, ...oldRooms];
        });
      }

      // Handle incoming real-time encrypted messages
      if (wsEvent.type === "ENCRYPTED_MESSAGE") {
        (async () => {
          const {
            roomId,
            encryptedContent,
            senderEncryptedKey,
            recipientEncryptedKey,
            iv,
            senderId,
            createdAt,
          } = wsEvent.payload;

          let plaintext = "New message received";
          if (myPrivateKey) {
            try {
              const isSender = senderId === currentUserId;
              plaintext = await decryptMessage(
                {
                  encryptedContent,
                  senderEncryptedKey,
                  recipientEncryptedKey,
                  iv,
                },
                myPrivateKey,
                isSender,
              );
            } catch {
              plaintext = "Unable to load message.";
            }
          }

          queryClient.setQueryData<ActionResponse<RoomEntity[] | null>>(
            ["rooms"],
            (oldResponse) => {
              if (!oldResponse || !oldResponse.data) return oldResponse;

              const rooms = oldResponse.data;
              const targetIndex = rooms.findIndex((r) => r.id === roomId);
              if (targetIndex === -1) return oldResponse;

              const updatedRoom: RoomEntity = {
                ...rooms[targetIndex],
                lastMessage: plaintext,
                lastMessageAt: createdAt,
                lastMessageSenderId: senderId,
                lastMessageIv: iv,
                lastMessageSenderEncryptedKey: senderEncryptedKey,
                lastMessageRecipientEncryptedKey: recipientEncryptedKey,
              };

              const remainingRooms = rooms.filter((r) => r.id !== roomId);
              return {
                ...oldResponse,
                data: [updatedRoom, ...remainingRooms],
              };
            },
          );
        })();
      }
    },
    [queryClient, myPrivateKey, currentUserId],
  );

  const { emitEvent } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080",
    roomId: "GLOBAL_SYNC_CHANNEL",
    onMessageReceived: onGlobalEventReceived,
  });

  return (
    <aside
      className={`flex-col w-full md:w-80 h-full bg-background p-4 border border-border rounded-xl shadow-sm transition-micro duration-200 ${isChatActive ? "hidden md:flex" : "flex"}`}
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
