"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { ActionResponse } from "@/types/actions";

type FormData = {
  username: string;
  password: string;
  publicKey: string;
  encryptedPrivateKey: string;
};

export async function registerUser(
  formData: FormData,
): Promise<ActionResponse> {
  const { username, password, publicKey, encryptedPrivateKey } = formData;

  if (!username || !password || !publicKey || !encryptedPrivateKey) {
    return {
      success: false,
      error: "The input values cannot be empty!",
      data: null,
    };
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
        data: null,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        publicKey,
        encryptedPrivateKey,
      },
    });

    return { success: true, error: null, data: null };
  } catch (error) {
    console.error("Registration execution crash:", error);

    return {
      success: false,
      error:
        "An unexpected database error occurred while creating the account!",
      data: null,
    };
  }
}

export async function loginUser(
  username: string,
  password: string,
): Promise<ActionResponse> {
  if (!username || !password) {
    return {
      success: false,
      error: "The username or password values cannot be empty!",
      data: null,
    };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    return { success: true, error: null, data: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Invalid username or password.",
        data: null,
      };
    }
    throw error;
  }
}

export async function logOut() {
  await signOut({
    redirectTo: "/login",
  });
}
