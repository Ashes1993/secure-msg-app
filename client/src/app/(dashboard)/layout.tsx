import Sidebar from "@/components/sidebar/Sidebar";
import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { WebSocketProvider } from "@/providers/WebSocketProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userPayload = session?.user
    ? {
        id: session.user.id ?? "",
        username: session.user.username ?? "",
      }
    : null;

  if (!userPayload) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <WebSocketProvider>
        <div className="w-full h-full bg-background text-foreground flex gap-4 overflow-hidden">
          <Sidebar />
          {children}
        </div>
      </WebSocketProvider>
    </SessionProvider>
  );
}
