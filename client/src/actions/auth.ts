"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { ActionResponse } from "@/types/actions";
import { UserProfileEntity } from "@/types/user";
import { revalidatePath } from "next/cache";
import {
  updateProfileSchema,
  UpdateProfileInput,
} from "@/lib/validations/profile";

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

export async function getUserProfile(): Promise<
  ActionResponse<UserProfileEntity | null>
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
    const profileData = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!profileData)
      return {
        success: false,
        error: "User Account not found. Try to sign in again.",
        data: null,
      };
    return {
      success: true,
      error: null,
      data: profileData,
    };
  } catch (err) {
    console.error(
      "[Actions:getUserProfile] Database error during retrieving user profile information:",
      err,
    );
    return {
      success: false,
      error:
        "Unable to retrieve profile information due to a system failure. Please try again shortly.",
      data: null,
    };
  }
}

export async function updateUserProfile(
  input: UpdateProfileInput,
): Promise<ActionResponse<UserProfileEntity | null>> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId)
    return {
      success: false,
      error: "Authentication session expired. Please sign in again.",
      data: null,
    };

  const validationResult = updateProfileSchema.safeParse(input);

  if (!validationResult.success) {
    const firstErrorMessage =
      validationResult.error.issues[0]?.message ||
      "Invalid profile data provided.";
    return {
      success: false,
      error: firstErrorMessage,
      data: null,
    };
  }

  try {
    const updatedUserProfile = await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: validationResult.data,
      select: {
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    revalidatePath("/profile");

    return {
      success: true,
      error: null,
      data: updatedUserProfile,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: "Unable to update profile settings. Please try again shortly.",
      data: null,
    };
  }
}
