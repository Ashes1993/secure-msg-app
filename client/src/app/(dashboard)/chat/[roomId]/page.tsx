import ChatContainer from "@/components/chat/ChatContainer";
import { auth } from "@/auth";
import { Lock } from "lucide-react";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const response = await params;
  const roomId = response.roomId;

  const session = await auth();
  const currentUserId = session?.user.id;

  if (!currentUserId)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center border border-border rounded-xl bg-muted-foreground/[0.05] p-6 text-center animate-fade-in">
        <div className="p-4 bg-destructive/10 rounded-full text-destrctive mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Session Unauthorized
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mt-1">
          Please log back into your cryptographic profile identity to view this
          communication channel.
        </p>
      </div>
    );

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden animate-slide-up">
      <ChatContainer roomId={roomId} currentUserId={currentUserId} />
    </div>
  );
}
