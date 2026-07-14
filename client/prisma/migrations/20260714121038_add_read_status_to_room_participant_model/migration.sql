-- AlterTable
ALTER TABLE "RoomParticipant" ADD COLUMN     "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastReadMessageId" TEXT;
