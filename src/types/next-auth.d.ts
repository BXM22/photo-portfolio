// ============================================================================
// TYPE AUGMENTATION
// ============================================================================
// NextAuth's built-in `Session["user"]` type only has name/email/image.
// We added a custom `id` field in src/lib/auth.ts's `session` callback, so
// we extend the library's type here to match what actually exists at
// runtime. Without this, `session.user.id` would be a TypeScript error even
// though the field really is there.
// ============================================================================

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
