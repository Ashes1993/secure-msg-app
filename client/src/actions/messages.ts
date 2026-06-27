"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionResponse } from "@/types/actions";

interface Message {
  senderId: string;
  content: string;
  createdAt: Date;
  iv: string;
}

export async function getMessages(
  roomId: string,
): Promise<ActionResponse<Message[] | null>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId)
    return { success: false, error: "User Unauthorized", data: null };

  if (!roomId) {
    return { success: false, error: "Invalid Room ID", data: null };
  }

  try {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
      select: {
        roomParticipants: {
          where: { userId },
          select: { userId: true },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            senderId: true,
            content: true,
            createdAt: true,
            iv: true,
          },
        },
      },
    });

    if (!room) {
      return { success: false, error: "conversation not found.", data: null };
    }

    if (room.roomParticipants.length === 0) {
      return {
        success: false,
        error: "Access Denied: You are not a participant of this conversation.",
        data: null,
      };
    }

    return { success: true, error: null, data: room.messages };
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
