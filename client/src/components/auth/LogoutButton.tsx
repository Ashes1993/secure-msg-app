"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { logOut } from "@/actions/auth";
import { useState } from "react";

export default function LogoutButton() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // 1. Clear the client-side cryptographic keys before the page redirects
      clearAuth();

      // 2. Trigger your server-side NextAuth signout sequence
      await logOut();
    } catch (error) {
      console.error("Logout sequence encountered an execution error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full px-4 py-2.5 text-sm font-medium text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-destructive-foreground rounded-xl transition-all disabled:opacity-50"
    >
      {isLoggingOut ? "Wiping credentials..." : "Disconnect Session"}
    </button>
  );
}
