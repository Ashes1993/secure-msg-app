"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateProfileInput } from "@/lib/validations/profile";
import { updateUserProfile } from "@/actions/auth";

export function useEditProfile() {
  const queryClient = useQueryClient();

  const editProfileMutation = useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const response = await updateUserProfile(input);

      if (!response.success) {
        throw new Error(response.error || "Failed to update profile settings.");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
    onError: (error) => {
      console.error("[Hooks:useEditProfile] Mutation failed:", error.message);
    },
  });

  return {
    editProfile: editProfileMutation.mutate,
    isPending: editProfileMutation.isPending,
    isSuccess: editProfileMutation.isSuccess,
    error: editProfileMutation.error?.message ?? null,
    reset: editProfileMutation.reset,
  };
}
