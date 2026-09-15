import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { conflict, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listTags } from "@/lib/queries";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";
import { tagCreateSchema } from "@/lib/validations";

export async function GET() {
  const tags = await listTags();
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const parsed = await parseJson(request, tagCreateSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const tag = await prisma.tag.create({ data: { name: parsed.data.name } });
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return conflict();
    }
    throw error;
  }
}
