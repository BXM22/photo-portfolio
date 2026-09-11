// ============================================================================
// AUTHENTICATION CONFIG (NextAuth.js / Auth.js)
// ============================================================================
// LEARNING NOTE: this site only ever needs ONE logged-in identity — you,
// the admin — so we use NextAuth's "Credentials" provider (email + password
// checked against our own database) instead of something like Google OAuth,
// which would be overkill for a single-admin site.
//
// SESSION STRATEGY: "jwt" vs "database"
//   - "database" sessions store a session row in Postgres and look it up on
//     every request. NextAuth's Prisma adapter needs extra tables for this
//     (Account, Session, VerificationToken).
//   - "jwt" sessions instead put the session data INSIDE a signed,
//     encrypted cookie. No database lookup needed on every request, and no
//     extra tables. Since we only have one user and don't need server-side
//     "log out everywhere" style session revocation, JWT is the simpler,
//     equally secure choice here — which is why prisma/schema.prisma has no
//     Account/Session models.
// ============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    // Tells NextAuth to redirect to OUR custom login page instead of its
    // built-in default one.
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        // `bcrypt.compare` re-hashes the submitted password with the same
        // salt stored inside `user.passwordHash` and checks it matches —
        // this is why we never need to "decrypt" a password to check it.
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        // Whatever object we return here becomes `user` in the `jwt`
        // callback below, and ultimately shapes `session.user`.
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    // Runs whenever a JWT is created or updated. We copy the user's id onto
    // the token so it's available later in the `session` callback — by
    // default NextAuth's JWT only carries name/email/image.
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // Runs whenever `auth()` / `useSession()` reads the session — shapes
    // exactly what the rest of the app (and the browser) gets to see.
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
