"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/actions/auth";

export function useProfile() {
  const profileDetails = useQuery({
    queryKey: ["user]", "[profile]"],
    queryFn: async () => {
      const response = await getUserProfile();
      if (!response.success) {
        throw new Error(
          response.error ||
            "Failed to retrieve user profile information. Please refresh the page.",
        );
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    profileData: profileDetails.data,
    isLoading: profileDetails.isLoading,
    isFetching: profileDetails.isFetching,
    error: profileDetails.error?.message ?? null,
  };
}
