/*
  Warnings:

  - You are about to drop the column `content` on the `Message` table. All the data in the column will be lost.
  - Added the required column `encryptedContent` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientEncryptedKey` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderEncrptedKey` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "content",
ADD COLUMN     "encryptedContent" TEXT NOT NULL,
ADD COLUMN     "recipientEncryptedKey" TEXT NOT NULL,
ADD COLUMN     "senderEncrptedKey" TEXT NOT NULL;
