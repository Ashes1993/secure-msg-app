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
  lastMessage: string;
}

export async function createRoom(
  targetUserId: string,
): Promise<ActionResponse<SanitizedRoom | null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return { success: false, error: "User unauthorized.", data: null };

  if (targetUserId === currentUserId)
    return {
      success: false,
      error: "User cannot create room with themselves",
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
    console.error("Database error during room creation layout:", err);
    return {
      success: false,
      error:
        "Encountered an internal error while building the messagin channel.",
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
    return { success: false, error: "User unauthorized.", data: null };

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
            content: true,
            createdAt: true,
            senderId: true,
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

        lastMessage: latestMessage?.content || "No messages yet. Say hello!",
      };
    });

    return { success: true, error: null, data: sanitizedRooms };
  } catch (err) {
    console.log("Database error during rooms retrieving: ", err);
    return {
      success: false,
      error:
        "Encountered an error when trying to retrieve rooms from the database",
      data: null,
    };
  }
}
