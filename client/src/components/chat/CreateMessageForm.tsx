"use client";

import { useCreateMessage } from "@/hooks/useCreateMessage";
import { useState } from "react";

export default function CreateMessageForm({
  roomId,
  targetPublicKey,
}: {
  roomId: string;
  targetPublicKey: string;
}) {
  const [message, setMessage] = useState<string>("");
  const { messageCreation, isLoading, error } = useCreateMessage();

  const sendMessage = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Guardrail: Do not encrypt or submit blank text streams
    if (!message.trim() || isLoading) return;

    // Pass an execution options block as the second parameter to handle UI mutations
    messageCreation(
      {
        roomId,
        messageText: message.trim(),
        targetPublicKey,
      },
      {
        onSuccess: () => {
          // Clear the form entry field only after verification of successful processing
          setMessage("");
        },
        onError: (err) => {
          console.error("Form level handling caught creation error:", err);
        },
      },
    );
  };

  return (
    <form
      onSubmit={sendMessage}
      className="w-full p-4 sticky bottom-14 flex items-center gap-4 rounded-xl shadow-md border border-border bg-card"
    >
      <textarea
        name="message"
        id="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="border border-border rounded-xl flex-1 p-4 resize-none min-h-[60px] max-h-[120px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
      ></textarea>
      <button
        type="submit"
        disabled={isLoading || !message.trim()}
        className="p-4 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Sending..." : "Send"}
      </button>

      {error && (
        <p className="text-xs text-destructive pl-2 font-medium absolute m-auto h-full">
          {error}
        </p>
      )}
    </form>
  );
}
