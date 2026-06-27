import Sidebar from "@/components/sidebar/Sidebar";
import React from "react";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-background text-foreground flex">
      <Sidebar />
      {children}
    </div>
  );
}
