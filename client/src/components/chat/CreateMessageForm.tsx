"use client";

import { useCreateMessage } from "@/hooks/useCreateMessage";
import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";

export default function CreateMessageForm({
  roomId,
  targetPublicKey,
  isDisabled,
}: {
  roomId: string;
  targetPublicKey: string | undefined;
  isDisabled: boolean;
}) {
  const [message, setMessage] = useState<string>("");
  const { messageCreation, isPending, error } = useCreateMessage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

  const sendMessage = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Do not encrypt or submit blank text streams
    if (!message.trim() || isPending) return;

    if (!targetPublicKey) return;

    messageCreation(
      {
        roomId,
        messageText: message.trim(),
        targetPublicKey,
      },
      {
        onSuccess: () => {
          setMessage("");
          if (textareaRef.current) textareaRef.current.style.height = "auto";
        },
        onError: (err) => {
          console.error(
            "[Component:CreateMessageForm] Form level handling caught creation error:",
            err,
          );
        },
      },
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={sendMessage}
      className="w-full flex items-end gap-2.5 bg-muted-foreground/[0.03] border border-border rounded-xl p-2 transition-micro focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        name="message"
        id="message"
        value={message}
        onKeyDown={handleKeyDown}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type a secure message..."
        disabled={isPending && isDisabled}
        className="flex-1 py-2 px-3 resize-none min-h-[40px] max-h-[120px] bg-transparent text-foreground text-xs placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 font-normal leading-relaxed custom-scrollbar"
      />
      <button
        type="submit"
        disabled={isPending || !message.trim()}
        className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
        aria-label="Dispatch secure frame payload"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <SendHorizontal className="w-4 h-4" />
        )}
      </button>

      {error && (
        <p className="text-xs text-destructive pl-2 font-medium absolute m-auto h-full">
          {error}
        </p>
      )}
    </form>
  );
}
