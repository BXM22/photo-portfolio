import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { conflict, notFound, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";
import { photoPatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const { id } = await context.params;
  const parsed = await parseJson(request, photoPatchSchema);
  if ("error" in parsed) return parsed.error;

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) return notFound();

  const { tagNames, ...photo } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (tagNames) {
        await tx.photoTag.deleteMany({ where: { photoId: id } });
      }

      return tx.photo.update({
        where: { id },
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
    });

    return NextResponse.json(updated);
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

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const { id } = await context.params;
  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) return notFound();

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
