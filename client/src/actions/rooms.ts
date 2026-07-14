"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ActionResponse } from "@/types/actions";
import { CreateRoomResult, RoomEntity, MarkAsRead } from "@/types/chat";

export async function createRoom(
  targetUserId: string,
): Promise<ActionResponse<CreateRoomResult | null>> {
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
    const participantSelect = {
      select: {
        user: {
          select: {
            id: true,
            username: true,
            publicKey: true,
          },
        },
      },
    };

    const existingRoom = await prisma.room.findFirst({
      where: {
        type: "DM",
        AND: [
          { roomParticipants: { some: { userId: currentUserId } } },
          { roomParticipants: { some: { userId: targetUserId } } },
        ],
      },
      select: {
        id: true,
        type: true,
        updatedAt: true,
        roomParticipants: participantSelect,
        messages: {
          orderBy: { createdAt: "desc" },
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

    if (existingRoom) {
      const callerParticipant = existingRoom.roomParticipants.find(
        (p) => p.user.id === currentUserId,
      )?.user;
      const targetParticipant = existingRoom.roomParticipants.find(
        (p) => p.user.id === targetUserId,
      )?.user;

      const latestMessage = existingRoom.messages[0];

      const userRoom: RoomEntity = {
        id: existingRoom.id,
        type: existingRoom.type,
        updatedAt: existingRoom.updatedAt,
        targetUserId: targetParticipant?.id || targetUserId,
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

      const recipientRoom: RoomEntity = {
        id: existingRoom.id,
        type: existingRoom.type,
        updatedAt: existingRoom.updatedAt,
        targetUserId: callerParticipant?.id || currentUserId,
        targetUserUsername: callerParticipant?.username || "Unknown User",
        targetUserPublicKey: callerParticipant?.publicKey || "null",
        lastMessage:
          latestMessage?.encryptedContent || "No messages yet. Say hello!",
        lastMessageSenderId: latestMessage?.senderId || null,
        lastMessageIv: latestMessage?.iv || null,
        lastMessageSenderEncryptedKey:
          latestMessage?.senderEncryptedKey || null,
        lastMessageRecipientEncryptedKey:
          latestMessage?.recipientEncryptedKey || null,
        lastMessageAt: latestMessage?.createdAt || null,
        currentUserId: targetUserId,
      };

      return {
        success: true,
        error: null,
        data: { userRoom, recipientRoom },
      };
    }

    // 2. Create new room if it doesn't exist
    const newRoom = await prisma.room.create({
      data: {
        type: "DM",
        roomParticipants: {
          create: [{ userId: currentUserId }, { userId: targetUserId }],
        },
      },
      select: {
        id: true,
        type: true,
        updatedAt: true,
        roomParticipants: participantSelect,
      },
    });

    const callerParticipant = newRoom.roomParticipants.find(
      (p) => p.user.id === currentUserId,
    )?.user;
    const targetParticipant = newRoom.roomParticipants.find(
      (p) => p.user.id === targetUserId,
    )?.user;

    const userRoom: RoomEntity = {
      id: newRoom.id,
      type: newRoom.type,
      updatedAt: newRoom.updatedAt,
      targetUserId: targetParticipant?.id || targetUserId,
      targetUserUsername: targetParticipant?.username || "Unknown User",
      targetUserPublicKey: targetParticipant?.publicKey || "null",
      lastMessage: "No messages yet. Say hello!",
      lastMessageSenderId: null,
      lastMessageIv: null,
      lastMessageSenderEncryptedKey: null,
      lastMessageRecipientEncryptedKey: null,
      lastMessageAt: null,
      currentUserId,
    };

    const recipientRoom: RoomEntity = {
      id: newRoom.id,
      type: newRoom.type,
      updatedAt: newRoom.updatedAt,
      targetUserId: callerParticipant?.id || currentUserId,
      targetUserUsername: callerParticipant?.username || "Unknown User",
      targetUserPublicKey: callerParticipant?.publicKey || "null",
      lastMessage: "No messages yet. Say hello!",
      lastMessageSenderId: null,
      lastMessageIv: null,
      lastMessageSenderEncryptedKey: null,
      lastMessageRecipientEncryptedKey: null,
      lastMessageAt: null,
      currentUserId: targetUserId,
    };

    return {
      success: true,
      error: null,
      data: { userRoom, recipientRoom },
    };
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

export async function getRooms(): Promise<ActionResponse<RoomEntity[] | null>> {
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

    const sanitizedRooms: RoomEntity[] = rooms.map((room) => {
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
    console.error(
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

export async function markAsRead(
  roomId: string,
  lastReadMessageId?: string,
): Promise<ActionResponse<MarkAsRead | null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  if (!roomId) {
    return {
      success: false,
      error:
        "Failed to receive the room ID. Please refresh and try again shortly.",
      data: null,
    };
  }

  try {
    const updatedParticipant = await prisma.roomParticipant.update({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId,
        },
      },
      data: {
        lastReadAt: new Date(),
        lastReadMessageId,
      },
    });
    const sanitizedData = {
      roomId: updatedParticipant.roomId,
      lastReadAt: updatedParticipant.lastReadAt,
      lastReadMessageId: updatedParticipant.lastReadMessageId,
    };
    return { success: true, error: null, data: sanitizedData };
  } catch (err) {
    console.error(
      "[ServerAction:markAsRead] Database exception encountered when updating the last read fields:",
      err,
    );
    return {
      success: false,
      error: "Unable to update the database. Please try again shortly.",
      data: null,
    };
  }
}
