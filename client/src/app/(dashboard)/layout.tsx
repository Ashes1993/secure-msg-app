import Sidebar from "@/components/sidebar/Sidebar";
import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full h-full bg-background text-foreground flex gap-4 overflow-hidden">
      <Sidebar username={user.username} />
      {children}
    </div>
  );
}
