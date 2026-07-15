"use client";

export default function TypingIndicatorBubble() {
  return (
    <div className="flex w-full justify-start animate-fade-in">
      <div className="max-w-[75%] px-4 py-4 text-sm rounded-2xl rounded-bl-sm shadow-sm bg-muted-foreground/[0.05] border border-border text-foreground">
        <div className="flex items-center space-x-1.5 h-5">
          <span
            className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"
            style={{ animationDelay: "150ms", animationDuration: "1s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"
            style={{ animationDelay: "300ms", animationDuration: "1s" }}
          />
        </div>
      </div>
    </div>
  );
}
