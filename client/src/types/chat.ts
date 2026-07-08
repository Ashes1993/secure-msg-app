export interface MessageEntity {
  id: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  senderEncryptedKey: string;
  recipientEncryptedKey: string;
  createdAt: Date;
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
}

export interface CreateRoomResult {
  userRoom: RoomEntity;
  recipientRoom: RoomEntity;
}
