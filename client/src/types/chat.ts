export interface MessageEntity {
  id: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  senderEncryptedKey: string;
  recipientEncryptedKey: string;
  createdAt: Date;
  isRead?: boolean;
}

export interface RoomEntity {
  id: string;
  type: "DM" | "GROUP";
  updatedAt: Date;
  targetUserId: string;
  targetUserUsername: string;
  targetUserPublicKey: string;
  lastMessage: string;
  lastMessageSenderId: string | null;
  lastMessageIv: string | null;
  lastMessageSenderEncryptedKey: string | null;
  lastMessageRecipientEncryptedKey: string | null;
  lastMessageAt: Date | null;
  currentUserId: string;
  unreadCount?: number;
}

export interface CreateRoomResult {
  userRoom: RoomEntity;
  recipientRoom: RoomEntity;
}

export interface MarkAsRead {
  roomId: string;
  lastReadAt: Date | null;
  lastReadMessageId?: string | null;
}

export type WebSocketEvent =
  | {
      type: "SUBSCRIBE";
      payload: { roomId?: string; userId: string; targetUserId?: string };
    }
  | { type: "UNSUBSCRIBE"; payload: { roomId?: string; userId: string } }
  | {
      type: "USER_STATUS_CHANGE";
      payload: {
        userId: string;
        isOnline: boolean;
      };
    }
  | {
      type: "ENCRYPTED_MESSAGE";
      payload: {
        recipientId?: string;
        roomId: string;
        message: MessageEntity;
      };
    }
  | {
      type: "TYPING_STATUS";
      payload: { roomId: string; userId: string; isTyping: boolean };
    }
  | {
      type: "ROOM_CREATED";
      payload: {
        recipientId: string;
        room: RoomEntity;
      };
    }
  | {
      type: "MARK_READ";
      payload: {
        roomId: string;
        readerId: string;
        lastReadMessageId: string;
        recipientId?: string;
      };
    };
