"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionResponse } from "@/types/actions";
import { MessageEntity } from "@/types/chat";

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
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  if (
    !roomId ||
    !encryptedContent?.trim() ||
    !iv?.trim() ||
    !senderEncryptedKey?.trim() ||
    !recipientEncryptedKey?.trim()
  ) {
    return {
      success: false,
      error: "Malformed payload structures encountered. Try again shortly.",
      data: null,
    };
  }

  try {
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
    console.error(
      "[Actions:createMessage] Database error durinng secure message allocation execution",
      err,
    );
    return {
      success: false,
      error:
        "Unable to create message due to a system failure. Please try again shortly.",
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
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  if (!roomId?.trim()) {
    return {
      success: false,
      error: "Bad request. Try again shortly.",
      data: null,
    };
  }

  const sanitizedLimit = Math.min(Math.max(limit, 1), 100);

  try {
    const [recipientParticipant, messages] = await Promise.all([
      prisma.roomParticipant.findFirst({
        where: {
          roomId,
          NOT: { userId: currentUserId },
        },
        select: {
          lastReadAt: true,
        },
      }),
      prisma.message.findMany({
        take: sanitizedLimit,
        ...(cursor?.trim() && { skip: 1, cursor: { id: cursor } }),
        where: {
          roomId,
          room: {
            roomParticipants: {
              some: { userId: currentUserId },
            },
          },
          NOT: {
            deletedFor: {
              has: currentUserId,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
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
    ]);

    const sanitizedMessages: MessageEntity[] = messages.map((msg) => {
      const isSentByMe = msg.senderId === currentUserId;

      const isRead = isSentByMe
        ? recipientParticipant?.lastReadAt
          ? msg.createdAt <= recipientParticipant.lastReadAt
          : false
        : true;

      return {
        ...msg,
        isRead,
      };
    });

    return { success: true, error: null, data: sanitizedMessages };
  } catch (err) {
    console.log(
      "[Actions:getMessages] Database error durinng secure message retrieval:",
      err,
    );
    return {
      success: false,
      error:
        "Unable to retrieve messages due to a system failure. Please try again shortly.",
      data: null,
    };
  }
}

export async function deleteMessage(
  messageId: string,
  type: "local" | "global",
): Promise<ActionResponse<null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  try {
    const chosenMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
        room: {
          roomParticipants: {
            some: { userId: currentUserId },
          },
        },
      },
      select: {
        roomId: true,
        senderId: true,
        deletedFor: true,
        room: {
          select: {
            roomParticipants: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!chosenMessage) {
      return {
        success: false,
        error:
          "Message not found or access denied. Please refresh and try again shortly.",
        data: null,
      };
    }

    if (type === "global") {
      if (currentUserId !== chosenMessage.senderId) {
        return {
          success: false,
          error:
            "Access denied. You can only globally delete your own messages.",
          data: null,
        };
      }

      await prisma.message.delete({
        where: { id: messageId },
      });
      return {
        success: true,
        error: null,
        data: null,
      };
    }

    if (type === "local") {
      if (chosenMessage.deletedFor.includes(currentUserId)) {
        return { success: true, error: null, data: null };
      }

      const otherParticipants = chosenMessage.room.roomParticipants.filter(
        (p) => p.userId !== currentUserId,
      );
      const isAllOthersDeleted = otherParticipants.every((participant) =>
        chosenMessage.deletedFor.includes(participant.userId),
      );

      if (isAllOthersDeleted) {
        await prisma.message.delete({
          where: { id: messageId },
        });
      } else {
        await prisma.message.update({
          where: {
            id: messageId,
          },
          data: {
            deletedFor: {
              push: currentUserId,
            },
          },
        });
      }
      return {
        success: true,
        error: null,
        data: null,
      };
    }
    return {
      success: false,
      error: "Invalid deletion request. Try again shortly.",
      data: null,
    };
  } catch (err) {
    console.error(
      "[Actions:deleteMessage] Database error during message deletion:",
      err,
    );
    return {
      success: false,
      error:
        "Unable to delete message due to a system failure. Please try again shortly.",
      data: null,
    };
  }
}
