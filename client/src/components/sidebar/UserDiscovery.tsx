"use client";

import { useUserDiscovery } from "@/hooks/useUserDiscovery";
import { useState } from "react";
import { Search, X, Loader2, Plus } from "lucide-react";

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
    <div className="relative w-full">
      {/* Search input */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 pointer-events-none" />
      <input
        type="text"
        id="search"
        placeholder="Search users here..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="py-3 pl-10 pr-10 w-full text-base md:text-sm  border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground placeholder:text-sm shadow-md outline-none focus:ring-1 focus:ring-ring focus:border-primary focus:shadow-lg transition-micro"
      />

      {searchQuery.length > 0 && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-micro cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Search results popover */}
      {searchQuery.trim().length > 0 && (
        <div className="absolute mt-2 top-full left-0 z-50 p-2 border border-border rounded-xl w-full max-h-[280px] md:max-h-[360px] bg-popover shadow-lg flex flex-col gap-2 overflow-y-auto scrollbar-none animate-popover">
          {/* Status messages */}
          {isSearching && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Searching...
            </div>
          )}

          {searchError && (
            <div className="p-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {searchError}
            </div>
          )}

          {creationError && (
            <div className="p-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {creationError}
            </div>
          )}

          {/* User results */}
          {!isSearching &&
            searchQuery.trim().length > 0 &&
            users.length > 0 &&
            users.map((user) => (
              <div
                key={user.id}
                className="group w-full rounded-xl bg-card border border-border/40 hover:border-border hover:bg-accent transition-micro"
              >
                <button
                  type="button"
                  onClick={() => {
                    createConversation(user.id);
                    setSearchQuery("");
                  }}
                  disabled={isCreatingRoom}
                  className="w-full flex items-center gap-3 p-2.5 text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-micro"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-card group-hover:border-transparent transition-micro">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate">
                      {user.username}
                    </span>
                    <span className="text-xs text-muted-forground truncate">
                      Verified network contact
                    </span>
                  </div>

                  <div className="text-muted-foreground group-hover:text-primary transition-micro shrink-0 ml-auto pr-1">
                    {isCreatingRoom ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5] transform group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </button>
              </div>
            ))}

          {/* Empty result state */}
          {!isSearching &&
            searchQuery.trim().length > 0 &&
            users.length === 0 &&
            !searchError && (
              <div className="text-sm text-muted-foreground p-1">
                No verified accounts found matching that username.
              </div>
            )}
        </div>
      )}
    </div>
  );
}
