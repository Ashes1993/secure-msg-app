"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ActionResponse } from "@/types/actions";

interface SanitizedRoom {
  id: string;
}

interface SidebarRoom {
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
}

export async function createRoom(
  targetUserId: string,
): Promise<ActionResponse<SanitizedRoom | null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  if (targetUserId === currentUserId)
    return {
      success: false,
      error:
        "Invalid operation. You cannot initiate a conversation channel with yourself.",
      data: null,
    };

  try {
    // Check if these two users already have a room
    const currentRoom = await prisma.room.findFirst({
      where: {
        type: "DM",
        AND: [
          { roomParticipants: { some: { userId: currentUserId } } },
          { roomParticipants: { some: { userId: targetUserId } } },
        ],
      },
      select: {
        id: true,
      },
    });

    if (currentRoom) {
      return { success: true, error: null, data: currentRoom };
    }

    const newRoom = await prisma.room.create({
      data: {
        type: "DM",
        roomParticipants: {
          create: [{ userId: currentUserId }, { userId: targetUserId }],
        },
      },
      select: {
        id: true,
      },
    });

    return { success: true, error: null, data: newRoom };
  } catch (err) {
    console.error(
      "[ServerAction:createRoom] Database exception encountered during creating a new room:",
      err,
    );
    return {
      success: false,
      error:
        "Unable to complete room creation request due to a system failure. Please try again shortly.",
      data: null,
    };
  }
}

export async function getRooms(): Promise<
  ActionResponse<SidebarRoom[] | null>
> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  try {
    const rooms = await prisma.room.findMany({
      where: {
        roomParticipants: {
          some: {
            userId: currentUserId,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },

      select: {
        id: true,
        type: true,
        updatedAt: true,
        roomParticipants: {
          where: {
            NOT: {
              userId: currentUserId,
            },
          },
          select: {
            user: {
              select: {
                id: true,
                username: true,
                publicKey: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            encryptedContent: true,
            createdAt: true,
            senderId: true,
            iv: true,
            senderEncryptedKey: true,
            recipientEncryptedKey: true,
          },
        },
      },
    });

    const sanitizedRooms: SidebarRoom[] = rooms.map((room) => {
      const targetParticipant = room.roomParticipants[0]?.user;
      const latestMessage = room.messages[0];

      return {
        id: room.id,
        type: room.type,
        updatedAt: room.updatedAt,

        targetUserId: targetParticipant?.id || "unknown-id",
        targetUserUsername: targetParticipant?.username || "Unknown User",
        targetUserPublicKey: targetParticipant?.publicKey || "null",

        lastMessage:
          latestMessage?.encryptedContent || "No messages yet. Say hello!",
        lastMessageSenderId: latestMessage?.senderId || null,
        lastMessageIv: latestMessage?.iv || null,
        lastMessageSenderEncryptedKey:
          latestMessage?.senderEncryptedKey || null,
        lastMessageRecipientEncryptedKey:
          latestMessage?.recipientEncryptedKey || null,
        lastMessageAt: latestMessage?.createdAt || null,
        currentUserId,
      };
    });

    return { success: true, error: null, data: sanitizedRooms };
  } catch (err) {
    console.log(
      "[ServerAction:getRooms] Database exception encountered during retrieving the rooms:",
      err,
    );
    return {
      success: false,
      error:
        "Unable to retrieve list of rooms due to a system failure. Please try again shortly.",
      data: null,
    };
  }
}
