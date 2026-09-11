// ============================================================================
// GET  /api/tags — PUBLIC. Powers the tag-filter chips on the gallery.
// POST /api/tags — ADMIN-ONLY. Create a new tag (also auto-created inline
//                   when tagging a photo with a brand-new tag name — see
//                   the admin upload form).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { createTagSchema } from "@/lib/validations";
import { slugify } from "@/lib/slug";
import { getTags } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(await getTags());
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slug = slugify(parsed.data.name);

  // `upsert` = "update if it exists, insert if it doesn't," in a single
  // atomic database call. Handy here because tag names are creatable
  // inline from the upload form, so "does this tag already exist?" comes
  // up constantly and we don't want a race condition between a separate
  // findFirst + create.
  const tag = await prisma.tag.upsert({
    where: { slug },
    update: {},
    create: { name: parsed.data.name, slug },
  });

  return NextResponse.json(tag, { status: 201 });
}
