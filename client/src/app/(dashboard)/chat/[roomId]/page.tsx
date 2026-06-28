import ChatContainer from "@/components/chat/ChatContainer";
import { auth } from "@/auth";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const response = await params;
  const roomId = response.roomId;

  const session = await auth();
  const currentUserId = session?.user.id;

  if (!currentUserId)
    return <div>User must be logged in to see the content</div>;

  return (
    <div className="h-full w-full">
      <ChatContainer roomId={roomId} currentUserId={currentUserId} />
    </div>
  );
}
