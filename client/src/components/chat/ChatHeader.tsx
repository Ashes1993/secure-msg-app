"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, User } from "lucide-react";

interface ChatHeaderProps {
  targetUserUsername: string | undefined;
  isConnected: boolean;
}

export default function ChatHeader({
  targetUserUsername,
  isConnected,
}: ChatHeaderProps) {
  return (
    <header className="w-full h-16 border-b border-border px-4 flex items-center justify-between bg-muted-foreground/[0.01] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/chat"
          className="p-2 -ml-2 rounded-xl hover:bg-muted-foreground/[0.05] text-muted-foreground hover:text-foreground transition-micro duration-200 md:hidden"
          aria-label="Back to message list"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl border border-border bg-muted-foreground/[0.05] flex items-center justify-center text-muted-foreground shrink-0">
            <User className="w-5 h-5" />
          </div>
          <span
            className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background transition-micro duration-300 ${isConnected ? "bg-primary" : "bg-accent animate-pulse"}`}
          />
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold text-md text-foreground truncate tracking-tight">
            {targetUserUsername}
          </h2>
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground truncate tracking-tight">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            Encrypted Connection
          </p>
        </div>
      </div>
    </header>
  );
}
