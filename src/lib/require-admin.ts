import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Gate for mutation handlers. Proxy is not enough — check the session here too. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
