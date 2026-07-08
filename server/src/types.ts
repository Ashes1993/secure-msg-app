export type WebSocketEvent =
  | {
      type: "SUBSCRIBE";
      payload: { roomId: string; userId: string };
    }
  | {
      type: "UNSUBSCRIBE";
      payload: { roomId: string; userId: string };
    }
  | {
      type: "ENCRYPTED_MESSAGE";
      payload: {
        id: string;
        roomId: string;
        senderId: string;
        encryptedContent: string;
        iv: string;
        senderEncryptedKey: string;
        recipientEncryptedKey: string;
        createdAt: Date;
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
    };
