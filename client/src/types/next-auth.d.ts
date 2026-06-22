import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    publicKey: string;
  }
  interface Session {
    user: {
      id: string;
      username: string;
      publicKey: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    publicKey: string;
  }
}
