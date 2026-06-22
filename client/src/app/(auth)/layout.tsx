import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col justify-center items-center w-full my-auto">
      <div className="flex flex-col justify-center items-center">
        <h2>Welcom Fellow Friend</h2>
        <p>Sign up or Sign in from the below form</p>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}
