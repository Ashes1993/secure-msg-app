import ChatContainer from "@/components/chat/ChatContainer";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const response = await params;
  const roomId = response.roomId;

  return (
    <div className="h-full w-full">
      <ChatContainer roomId={roomId} />
    </div>
  );
}
