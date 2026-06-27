"use client";
import { useUserDiscovery } from "@/hooks/useUserDiscovery";
import { useState } from "react";

export default function UserDiscovery() {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const {
    users,
    isSearching,
    searchError,
    createConversation,
    isCreatingRoom,
    creationError,
  } = useUserDiscovery(searchQuery);

  return (
    <div className="relative">
      <label htmlFor="search">Search users</label>
      <input
        type="text"
        id="search"
        placeholder="Search here..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="p-2 border border-border rounded-xl placeholder:text-muted-foreground shadow-md shadow-primary active:shadow-primary-hover outline-none"
      />

      {searchQuery.trim().length > 0 && (
        <div className="absolute mt-1 top-auto z-50 p-2 border border-border rounded-xl w-full">
          {isSearching && (
            <div className="text-sm text-muted-foreground">
              Searching for users...
            </div>
          )}

          {searchError && <div>{searchError}</div>}
          {creationError && <div>{creationError}</div>}

          {!isSearching &&
            searchQuery.trim().length > 0 &&
            users.length > 0 &&
            users.map((user) => (
              <div key={user.id}>
                <button
                  type="button"
                  onClick={() => createConversation(user.id)}
                  disabled={isCreatingRoom}
                >
                  {isCreatingRoom ? "Connecting" : user.username}
                </button>
              </div>
            ))}

          {!isSearching &&
            searchQuery.trim().length > 0 &&
            users.length === 0 &&
            !searchError && <div>No User was found</div>}
        </div>
      )}
    </div>
  );
}
