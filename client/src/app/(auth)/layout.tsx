import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col justify-center items-center w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 px-4">
      <div className="flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Join the encrypted network
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center">
          Sign up or Sign in from the below form
        </p>
      </div>
      <div className="w-full flex justify-center">{children}</div>
    </div>
  );
}
