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
        roomId: string;
        senderId: string;
        recipientId: string;
        encryptedPayload: string;
      };
    }
  | {
      type: "TYPING_STATUS";
      payload: { roomId: string; userId: string; isTyping: boolean };
    };
