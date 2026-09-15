import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { conflict, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listPhotos } from "@/lib/queries";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";
import { photoCreateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 24) || 24),
  );

  const result = await listPhotos({
    page,
    pageSize,
    tag: searchParams.get("tag") ?? undefined,
    album: searchParams.get("album") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const parsed = await parseJson(request, photoCreateSchema);
  if ("error" in parsed) return parsed.error;

  const { tagNames, ...photo } = parsed.data;

  try {
    const created = await prisma.photo.create({
      data: {
        ...photo,
        tags: tagNames
          ? {
              create: tagNames.map((name) => ({
                tag: {
                  connectOrCreate: { where: { name }, create: { name } },
                },
              })),
            }
          : undefined,
      },
    });
    return NextResponse.json(created, { status: 201 });
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
