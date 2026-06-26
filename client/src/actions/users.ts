"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionResponse } from "@/types/actions";

interface SanitizedUser {
  id: string;
  username: string;
  publicKey: string;
}

export async function getUser(
  searchQuery: string,
): Promise<ActionResponse<SanitizedUser[]>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "User unauthorized.", data: [] };
  }

  try {
    const searchedUsers = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        username: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        publicKey: true,
      },
    });

    return { success: true, error: null, data: searchedUsers };
  } catch (err) {
    console.log("Database error during user discovery lookup:", err);
    return {
      success: false,
      error: "Encountered error while getting user data from the database.",
      data: [],
    };
  }
}
