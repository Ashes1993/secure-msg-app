import NextAuth from "next-auth";
import prisma from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },

      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        const { username, password } = credentials;

        const user = await prisma.user.findUnique({
          where: {
            username: username as string,
          },
          select: {
            id: true,
            username: true,
            password: true,
            publicKey: true,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password as string,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.publicKey = user.publicKey;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.publicKey = token.publicKey as string;
      }
      return session;
    },
  },
});
