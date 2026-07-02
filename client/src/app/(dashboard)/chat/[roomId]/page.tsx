import ChatContainer from "@/components/chat/ChatContainer";
import { auth } from "@/auth";
import { Metadata } from "next";
import ErrorState from "@/components/ui/ErrorState";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const roomId = resolvedParams.roomId;

  return {
    title: `Secure Chat Frame [${roomId.slice(0, 8)}]`,
    description: "End-to-end encrypted cryptography communication channel",
    robots: { index: false, follow: false },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const response = await params;
  const roomId = response.roomId;

  const session = await auth();
  const currentUserId = session?.user.id;

  if (!currentUserId)
    return (
      <ErrorState
        title="Session Unauthorized"
        message="Please log back into your cryptographic profile identity to view this communication channel."
      />
    );

  return (
    <div className="h-full min-h-0 w-full flex-1 bg-background overflow-hidden animate-slide-up">
      <ChatContainer roomId={roomId} currentUserId={currentUserId} />
    </div>
  );
}
