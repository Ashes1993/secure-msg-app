"use client";

import { useSession } from "next-auth/react";

export function useAuthenticatedUser() {
  const { data: session } = useSession({ required: true });

  return {
    user: session?.user,
  };
}
