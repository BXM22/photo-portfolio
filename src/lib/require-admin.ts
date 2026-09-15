import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/** Gate for mutation handlers. Proxy is not enough — check the session here too. */
export async function requireAdmin(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function isUnauthorized(
  result: Session | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
