"use client";

import { useState, useEffect } from "react";
import { registerUser } from "@/actions/auth";
import { generateE2EKeys } from "@/lib/crypto";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string>("");

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
    setIsLoading(true);

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
      setErrorStatus(
        "Username must be a3-20 characters and contain only letters, numbers, or underscores.",
      );
      return;
    }

    if (password.length < 8) {
      setErrorStatus("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorStatus("Passwords do not match.");
      return;
    }

    try {
      const { publicKey, encryptedPrivateKey } =
        await generateE2EKeys(password);

      const action = await registerUser({
        username,
        password,
        publicKey,
        encryptedPrivateKey,
      });

      if (action.success) {
        setIsLoading(false);
        router.push("/login");
      } else {
        setErrorStatus(
          action.error || "An error occurred during account creation.",
        );
      }
    } catch (error) {
      console.log("Error while executing cryptographic assignment:", error);
      setErrorStatus(
        "Failed to execute cryptographic key assignment or server communication.",
      );
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
          placeholder="Choose a username"
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

      <div className="flex flex-col w-full space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-foreground "
        >
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          className="w-full px-3.5 py-2 border rounded-xl border-border bg-transparent outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-sm placeholder:text-muted-foreground transition-all duration-200"
          onChange={(event) => setConfirmPassword(event.target.value)}
          value={confirmPassword}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        className="py-2 text-background rounded-xl font-medium w-full bg-primary hover:bg-primary-hover shadow-sm shadow-emerald-900/10 active:scale-[0.98] transitio-all duration-200 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center "
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Create Account"
        )}
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
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Login
        </Link>
      </p>
    </form>
  );
}
