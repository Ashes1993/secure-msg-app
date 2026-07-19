export type WebSocketEvent =
  | {
      type: "SUBSCRIBE";
      payload: { roomId?: string; userId: string; targetUserId?: string };
    }
  | {
      type: "UNSUBSCRIBE";
      payload: { roomId?: string; userId: string };
    }
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
        message: {
          id: string;
          senderId: string;
          encryptedContent: string;
          iv: string;
          senderEncryptedKey: string;
          recipientEncryptedKey: string;
          isEdited: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
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
        room: {
          id: string;
          type: string;
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
        };
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
    }
  | {
      type: "MESSAGE_DELETED";
      payload: {
        roomId: string;
        userId: string;
        messageId: string;
      };
    }
  | {
      type: "MESSAGE_EDITED";
      payload: {
        recipientId?: string;
        roomId: string;
        message: {
          id: string;
          senderId: string;
          encryptedContent: string;
          iv: string;
          senderEncryptedKey: string;
          recipientEncryptedKey: string;
          isEdited: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      };
    };
