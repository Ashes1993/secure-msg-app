-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
