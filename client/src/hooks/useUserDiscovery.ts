"use client";

import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/actions/users";

export function useUserDiscovery(searchQuery: string) {
  const userSearchQuery = useQuery({
    queryKey: ["users", searchQuery],

    queryFn: async () => {
      const response = await getUser(searchQuery);
      if (!response.success) {
        throw new Error(
          response.error ||
            "Failed to fetch the users. Please try again shortly.",
        );
      }

      return response.data;
    },

    enabled: searchQuery.trim().length > 0,
  });

  return {
    users: userSearchQuery.data || [],
    isSearching: userSearchQuery.isFetching,
    searchError: userSearchQuery.error?.message || null,
  };
}
