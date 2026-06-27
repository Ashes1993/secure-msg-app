"use client";

import UserDiscovery from "./UserDiscovery";

export default function Sidebar() {
  return (
    <aside className="m-4 w-full md:w-1/4 bg-background text-foreground p-4 shadow-md shadow-muted-foreground border-border rounded-xl">
      <h1 className="font-bold text-xl mb-4">Messaging App</h1>

      {/* Search section */}
      <UserDiscovery />
      {/* Conversations */}

      {/* Logout */}
    </aside>
  );
}
