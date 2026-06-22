"use client";

import { ChangeEvent, useState } from "react";
import { registerUser } from "@/actions/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorStatus, setErrorStatus] = useState<string>("");

  // Browser-side key generation
  const generateE2EKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    // Convert the raw key buffer into a standard stringified JSON web key
    const exportedPublicKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey,
    );
    const exportedPrivateKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey,
    );

    localStorage.setItem("msg_private_key", JSON.stringify(exportedPrivateKey));

    return JSON.stringify(exportedPublicKey);
  };

  const handleSubmit = async (event: ChangeEvent<HTMLElement>) => {
    event.preventDefault();
    setErrorStatus("");

    try {
      const publicKey = await generateE2EKeys();
      const action = await registerUser({ username, password, publicKey });

      if (action.success) {
        router.push("/signin");
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
      className="flex flex-col justify-center items-center border border-slate-500 rounded-xl mx-10 space-y-3 mt-5 py-5"
    >
      <div className="flex flex-col">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          className="border rounded-xl"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          className="border rounded-xl"
          onChange={(event) => setPassword(event.target.value)}
          value={password}
        />
      </div>

      <button
        type="submit"
        className="w-1/2 py-2 bg-blue-600 text-white rounded-xl foont-medium hover:bg-blue-700 transition"
      >
        Create Account
      </button>
      {errorStatus && <p className="text-red-600 text-sm">{errorStatus}</p>}
    </form>
  );
}
