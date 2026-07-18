"use client";

import { DeleteStage } from ".";
import { createPortal } from "react-dom";

interface DeleteFlowModalProps {
  stage: DeleteStage;
  onClose: () => void;
  onConfirm: (type: "local" | "global") => void;
  isPending: boolean;
}

export function DeleteFlowModal({
  stage,
  onClose,
  onConfirm,
  isPending,
}: DeleteFlowModalProps) {
  if (stage === "IDLE") return null;

  const portalTarget = document.getElementById("chat-workspace-root");

  return createPortal(
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[450px] p-6 bg-card border border-border rounded-xl shadow-xl animate-slide-up sm:animate-fade-in"
      >
        {/* Choosing between local and global deletetion */}
        {stage === "SELECT_TYPE" && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Delete Message?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how you want to remove this message from the channel.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => onConfirm("global")}
                className="w-full px-4 py-2.5 bg-destructive text-destructive-foreground font-medium rounded-xl hover:bg-destructive/90 transition-colors text-sm"
              >
                Delete for Everyone
              </button>
              <button
                onClick={() => onConfirm("local")}
                className="w-full px-4 py-2.5 border border-border font-medium rounded-xl hover:bg-accent transition-colors text-sm"
              >
                Delete for Me
              </button>
              <button
                onClick={onClose}
                className="w-full border border-border px-4 py-3 rounded-xl mt-2 text-xs text-muted-foreground hover:bg-accent/[0.2]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Final confirmation for local deletion */}
        {stage === "CONFIRM_LOCAL" && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-amber-500">
              Are you absolutely sure?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove this message from your device
              history. The other participants will still see it.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm("local")}
                disabled={isPending}
                className={`px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors ${isPending && "animate-pulse"}`}
              >
                {isPending ? "Removing..." : "Yes, Delete for Me"}
              </button>
            </div>
          </div>
        )}

        {/* Final confirmation for Global Purge */}
        {stage === "CONFIRM_GLOBAL" && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-destructive">
              Delete message globally?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete the message for all participants of
              this room. This operation cannot be reversed.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm("global")}
                disabled={isPending}
                className={`px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors ${isPending && "animate-pulse"}`}
              >
                {isPending ? "Removing..." : "Yes, Delete for Everyone"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    portalTarget || document.body,
  );
}
