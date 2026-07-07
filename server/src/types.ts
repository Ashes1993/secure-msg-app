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
          targetUserId: string;
          targetUserPublicKey: string;
          createdAt: string | Date;
        };
      };
    };
