export interface MessageEntity {
  id: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  senderEncryptedKey: string;
  recipientEncryptedKey: string;
  createdAt: Date;
}
