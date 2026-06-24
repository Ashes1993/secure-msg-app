"use client";

import { useState, useEffect } from "react";
import { decryptE2EKey } from "@/lib/crypto";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string>("");

  const setAuthKeys = useAuthStore((state) => state.setAuthKeys);

  useEffect(() => {
    if (!errorStatus) return;

    const timer = setTimeout(() => {
      setErrorStatus("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [errorStatus]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorStatus("");

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
      setErrorStatus(
        "Username must be a 3-20 characters and contain only letters, numbers, or underscores.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(username, password);

      if (!response.success) {
        setErrorStatus(response.error || "Invalid username or password");
        setIsLoading(false);
        return;
      }

      const session = await getSession();

      if (!session?.user?.encryptedPrivateKey || !session?.user?.publicKey) {
        setErrorStatus("Key construction failed.");
        setIsLoading(false);
        return;
      }

      try {
        const decryptedPrivateKey = await decryptE2EKey(
          session.user.encryptedPrivateKey,
          password,
        );
        setAuthKeys(decryptedPrivateKey, session.user.publicKey);
      } catch (cryptoError) {
        console.error("Cryptographic key failure:", cryptoError);
        setErrorStatus(
          "Authentication succeeded, but key reconstruction failed.",
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push("/");
    } catch (error) {
      console.log("Error while logging in the user:", error);
      setErrorStatus("Failed to login due to server error. Try again.");
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center w-full max-w-md p-6 sm:p-8 bg-card text-foreground border border-border shadow-xl rounded-2xl space-y-6"
    >
      <div className="flex flex-col w-full space-y-1.5">
        <label
          htmlFor="username"
          className="text-sm font-medium text-foreground"
        >
          Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          className="w-full px-3.5 py-2 border rounded-xl border-border bg-transparent outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-sm placeholder:text-muted-foreground transition-all duration-200"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
          placeholder="Enter your username"
          required
        />
      </div>

      <div className="flex flex-col w-full space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground "
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          className="w-full px-3.5 py-2 border rounded-xl border-border bg-transparent outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-sm placeholder:text-muted-foreground transition-all duration-200"
          onChange={(event) => setPassword(event.target.value)}
          value={password}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        className="py-2 text-background rounded-xl font-medium w-full bg-primary hover:bg-primary-hover shadow-sm shadow-emerald-900/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
      </button>
      {errorStatus && (
        <div
          role="alert"
          className="w-full p-3 text-sm rounded-xl text-destructive bg-destructive/10 border border-destructive/20"
        >
          {errorStatus}
        </div>
      )}
      <p className="text-sm text-foreground text-center">
        Do not have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
