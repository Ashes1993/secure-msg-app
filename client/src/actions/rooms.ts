"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
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
        deletedFor: true,
        roomParticipants: participantSelect,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            encryptedContent: true,
            createdAt: true,
            senderId: true,
            iv: true,
            senderEncryptedKey: true,
            recipientEncryptedKey: true,
            deletedFor: true,
          },
        },
      },
    });

    if (existingRoom) {
      if (existingRoom.deletedFor.includes(currentUserId)) {
        await prisma.room.update({
          where: { id: existingRoom.id },
          data: {
            deletedFor: {
              set: existingRoom.deletedFor.filter((id) => id !== currentUserId),
            },
          },
        });
      }

      const senderParticipant = existingRoom.roomParticipants.find(
        (p) => p.user.id === currentUserId,
      )?.user;
      const targetParticipant = existingRoom.roomParticipants.find(
        (p) => p.user.id === targetUserId,
      )?.user;

      const senderLatestMessage = existingRoom.messages.find(
        (m) => !m.deletedFor.includes(currentUserId),
      );
      const targetLatestMessage = existingRoom.messages.find(
        (m) => !m.deletedFor.includes(targetUserId),
      );

      const userRoom: RoomEntity = {
        id: existingRoom.id,
        type: existingRoom.type,
        updatedAt: existingRoom.updatedAt,
        targetUserId: targetParticipant?.id || targetUserId,
        targetUserUsername: targetParticipant?.username || "Unknown User",
        targetUserPublicKey: targetParticipant?.publicKey || "null",
        lastMessage:
          senderLatestMessage?.encryptedContent ||
          "No messages yet. Say hello!",
        lastMessageSenderId: senderLatestMessage?.senderId || null,
        lastMessageIv: senderLatestMessage?.iv || null,
        lastMessageSenderEncryptedKey:
          senderLatestMessage?.senderEncryptedKey || null,
        lastMessageRecipientEncryptedKey:
          senderLatestMessage?.recipientEncryptedKey || null,
        lastMessageAt: senderLatestMessage?.createdAt || null,
        currentUserId,
      };

      const recipientRoom: RoomEntity = {
        id: existingRoom.id,
        type: existingRoom.type,
        updatedAt: existingRoom.updatedAt,
        targetUserId: senderParticipant?.id || currentUserId,
        targetUserUsername: senderParticipant?.username || "Unknown User",
        targetUserPublicKey: senderParticipant?.publicKey || "null",
        lastMessage:
          targetLatestMessage?.encryptedContent ||
          "No messages yet. Say hello!",
        lastMessageSenderId: targetLatestMessage?.senderId || null,
        lastMessageIv: targetLatestMessage?.iv || null,
        lastMessageSenderEncryptedKey:
          targetLatestMessage?.senderEncryptedKey || null,
        lastMessageRecipientEncryptedKey:
          targetLatestMessage?.recipientEncryptedKey || null,
        lastMessageAt: targetLatestMessage?.createdAt || null,
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
        NOT: {
          deletedFor: {
            has: currentUserId,
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
          select: {
            userId: true,
            lastReadAt: true,
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
          where: {
            NOT: {
              deletedFor: {
                has: currentUserId,
              },
            },
          },
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

    const roomIds = rooms.map((r) => r.id);

    const unreadCountsRaw: Array<{ roomId: string; unreadCount: bigint }> =
      roomIds.length > 0
        ? await prisma.$queryRaw`
        SELECT m."roomId", COUNT(m.id) AS "unreadCount"
        FROM "Message" m
        JOIN "RoomParticipant" rp 
          ON rp."roomId" = m."roomId" 
         AND rp."userId" = ${currentUserId}
        WHERE m."roomId" IN (${Prisma.join(roomIds)})
          AND m."senderId" != ${currentUserId}
          AND NOT (${currentUserId} = ANY(m."deletedFor"))
          AND (rp."lastReadAt" IS NULL OR m."createdAt" > rp."lastReadAt")
        GROUP BY m."roomId"
      `
        : [];

    // Map the unread counts into an accessible Map object
    const unreadMap = new Map(
      unreadCountsRaw.map((item) => [item.roomId, Number(item.unreadCount)]),
    );

    const sanitizedRooms: RoomEntity[] = rooms.map((room) => {
      const targetParticipant = room.roomParticipants.find(
        (p) => p.userId !== currentUserId,
      )?.user;
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

        unreadCount: unreadMap.get(room.id) || 0,
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

export async function deleteRoom(
  roomId: string,
): Promise<ActionResponse<null>> {
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
        "No room ID is received to proceed. Please refresh the page and try again.",
      data: null,
    };
  }

  try {
    const chosenRoom = await prisma.room.findFirst({
      where: {
        id: roomId,
        roomParticipants: {
          some: {
            userId: currentUserId,
          },
        },
      },
      select: {
        deletedFor: true,
        roomParticipants: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!chosenRoom)
      return {
        success: false,
        error:
          "No room with this ID exists. Please refresh the page and try again shortly.",
        data: null,
      };

    if (chosenRoom.deletedFor.includes(currentUserId))
      return { success: true, error: null, data: null };

    const otherParticipants = chosenRoom.roomParticipants.filter(
      (participant) => participant.userId !== currentUserId,
    );
    const isAllOthersDeleted =
      otherParticipants.length > 0 &&
      otherParticipants.every((participant) =>
        chosenRoom.deletedFor.includes(participant.userId),
      );

    if (isAllOthersDeleted) {
      await prisma.room.delete({
        where: {
          id: roomId,
        },
      });

      return { success: true, error: null, data: null };
    }

    await prisma.$transaction([
      prisma.room.update({
        where: {
          id: roomId,
        },
        data: {
          deletedFor: {
            push: currentUserId,
          },
        },
      }),
      prisma.message.updateMany({
        where: {
          roomId,
          NOT: {
            deletedFor: {
              has: currentUserId,
            },
          },
        },
        data: {
          deletedFor: {
            push: currentUserId,
          },
        },
      }),
    ]);

    return { success: true, error: null, data: null };
  } catch (err) {
    console.error(
      "[ServerAction:deleteRoom] Database exception encountered when deleting a room:",
      err,
    );
    return {
      success: false,
      error: "Unable to delete the room. Please try again shortly.",
      data: null,
    };
  }
}
