import { NextResponse } from "next/server";
import type { z } from "zod";

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}

export function conflict() {
  return NextResponse.json({ error: "Conflict" }, { status: 409 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
