"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ActionResponse } from "@/types/actions";

interface SanitizedRoom {
  id: string;
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
