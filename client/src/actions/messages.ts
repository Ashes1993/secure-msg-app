"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionResponse } from "@/types/actions";

interface MessageEntity {
  id: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  senderEncryptedKey: string;
  recipientEncryptedKey: string;
  createdAt: Date;
}

export async function createMessage(
  roomId: string,
  encryptedContent: string,
  iv: string,
  senderEncryptedKey: string,
  recipientEncryptedKey: string,
): Promise<ActionResponse<MessageEntity | null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return { success: false, error: "User Unauthorized", data: null };

  if (
    !roomId ||
    !encryptedContent ||
    !iv ||
    !senderEncryptedKey ||
    !recipientEncryptedKey
  ) {
    return {
      success: false,
      error: "Malformed payload structures encountered",
      data: null,
    };
  }

  const roomMembership = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    select: {
      roomParticipants: {
        where: {
          userId: currentUserId,
        },
        select: { userId: true },
      },
    },
  });

  if (!roomMembership || roomMembership.roomParticipants.length === 0) {
    return {
      success: false,
      error:
        "Access Denied: You are not an active participant of this conversation.",
      data: null,
    };
  }

  try {
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          roomId,
          senderId: currentUserId,
          encryptedContent,
          iv,
          senderEncryptedKey,
          recipientEncryptedKey,
        },
        select: {
          id: true,
          senderId: true,
          encryptedContent: true,
          iv: true,
          senderEncryptedKey: true,
          recipientEncryptedKey: true,
          createdAt: true,
        },
      }),

      prisma.room.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return { success: true, error: null, data: newMessage };
  } catch (err) {
    console.error("Database error while creating a message: ", err);
    return {
      success: false,
      error: "Encountered an erro while creating the message in the database",
      data: null,
    };
  }
}

export async function getMessages(
  roomId: string,
  cursor?: string,
  limit = 50,
): Promise<ActionResponse<MessageEntity[] | null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return { success: false, error: "User Unauthorized", data: null };

  if (!roomId) {
    return { success: false, error: "Invalid Room ID", data: null };
  }

  try {
    const messages = await prisma.message.findMany({
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where: {
        roomId,
        room: {
          roomParticipants: {
            some: { userId: currentUserId },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        senderId: true,
        encryptedContent: true,
        iv: true,
        senderEncryptedKey: true,
        recipientEncryptedKey: true,
        createdAt: true,
      },
    });

    return { success: true, error: null, data: messages };
  } catch (err) {
    console.log("Error while retrieving messages from the database: ", err);
    return {
      success: false,
      error:
        "Encountered an internal error while retrieving messages from the database.",
      data: null,
    };
  }
}
