"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useDeleteRoom } from "@/hooks/useDeleteRoom";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  EllipsisVertical,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ChatHeaderProps {
  targetUserUsername: string | undefined;
  isConnected: boolean;
  roomId: string | undefined;
}

export function ChatHeader({
  targetUserUsername,
  isConnected,
  roomId,
}: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const { deleteRoomMutateAsync, isPending: isDeletePending } = useDeleteRoom();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsConfirmOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!roomId || isDeletePending) return;

    try {
      await deleteRoomMutateAsync({ roomId });
    } catch (err) {
      console.error("[Components:ChatHeader] Failed to delete room:", err);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <header className="w-full h-16 border-b border-border px-4 flex items-center justify-between bg-muted-foreground/[0.01] shrink-0">
        <div className="w-full flex items-center gap-3 min-w-0">
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

          <div className="relative ml-auto" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted-foreground/[0.08] transition-colors duration-200"
              aria-label="Room options"
              aria-expanded={isMenuOpen}
            >
              <EllipsisVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-[140px] flex flex-col p-1 gap-2.5 bg-card z-40 border border-border rounded-xl shadow-lg text-xs animate-popover">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsConfirmOpen(true);
                  }}
                  className="flex justify-start items-center gap-2.5 hover:bg-destructive/10 hover:rounded-lg px-2 py-2 transition-colors font-medium"
                  disabled={isDeletePending}
                >
                  <Trash2 className="w-4 h-4 text-destructive shrink-0" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isDeletePending && setIsConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {isDeletePending
                    ? "Deleting Conversation..."
                    : "Delete Conversation"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isDeletePending
                    ? "Removing room and redirecting to inbox..."
                    : "This conversation will be removed from your inbox."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {!isDeletePending && (
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletePending}
                className="px-3.5 py-2 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Chat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
