export default function Chat() {
  return (
    <div className="hidden md:flex flex-1 h-full items-center justify-center border border-border rounded-xl bg-muted/10 text-muted-foreground text-sm font-medium">
      <div className="text-center space-y-1">
        <p className="text-base text-foreground font-semibold">
          No Conversation Selected
        </p>
        <p className="text-xs">
          Choose an active room from the panel layout to begin verification
          cycles.
        </p>
      </div>
    </div>
  );
}
