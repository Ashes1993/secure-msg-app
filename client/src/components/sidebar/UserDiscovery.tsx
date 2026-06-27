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
      <input
        type="text"
        id="search"
        placeholder="Search users here"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="p-2 border border-border rounded-xl placeholder:text-muted-foreground placeholder:text-sm shadow-md outline-none"
      />

      {searchQuery.trim().length > 0 && (
        <div className="absolute mt-2 top-auto z-50 p-2 border border-border rounded-xl w-full bg-background/90 flex flex-col gap-1 transition-all">
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
              <div
                key={user.id}
                className="bg-card border border-border rounded-xl p-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    createConversation(user.id);
                    setSearchQuery("");
                  }}
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
