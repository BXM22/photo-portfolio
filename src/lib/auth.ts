import NextAuth from "next-auth"; // factory: config in, handlers/auth/signIn/signOut out
import Credentials from "next-auth/providers/credentials"; // email + password, not OAuth
import bcrypt from "bcryptjs"; // compare the plaintext password to User.passwordHash
import { prisma } from "@/lib/prisma"; // look up the one admin row by email

export const { handlers, auth, signIn, signOut } = NextAuth({
  // signs the JWT cookie; same value as AUTH_SECRET in .env
  secret: process.env.AUTH_SECRET,
  // Auth.js must trust the request host in local/dev (and on Vercel)
  trustHost: true,
  // Credentials cannot use a database session; the cookie is a signed JWT
  session: { strategy: "jwt" },
  // send unauthenticated users here instead of Auth.js's default sign-in page
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      // describes the fields; does not validate them
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // return a user to log in, or null to reject
      async authorize(credentials) {
        const email = credentials.email;
        const password = credentials.password;
        // credentials arrive as unknown; reject anything that is not a string
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // slow on purpose — that is bcrypt
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        // never return passwordHash. same null for bad email and bad password
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    // runs at sign-in (user is set) and on later requests (user is missing)
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    // what auth() returns; copy the id from the token onto the session
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
