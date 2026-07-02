import Sidebar from "@/components/sidebar/Sidebar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full bg-background text-foreground flex gap-4 overflow-hidden">
      <Sidebar />
      {children}
    </div>
  );
}
