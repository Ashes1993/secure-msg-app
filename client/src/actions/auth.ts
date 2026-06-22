"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

type FormData = {
  username: string;
  password: string;
  publicKey: string;
};

interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function registerUser(
  formData: FormData,
): Promise<ActionResponse> {
  const { username, password, publicKey } = formData;

  if (!username || !password || !publicKey) {
    return { success: false, error: "The input values cannot be empty!" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error:
          "A user with this username already exists! Try another user name.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        publicKey,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration execution crash:", error);

    return {
      success: false,
      error:
        "An unexpected database error occurred while creating the account!",
    };
  }
}
