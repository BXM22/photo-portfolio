import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";
import { buildStorageKey, createPresignedUploadUrl } from "@/lib/s3";
import { uploadSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const parsed = await parseJson(request, uploadSchema);
  if ("error" in parsed) return parsed.error;

  const ext =
    parsed.data.contentType === "image/jpeg"
      ? "jpg"
      : parsed.data.contentType.split("/")[1] ?? "jpg";
  const key = buildStorageKey(`photo.${ext}`);
  const url = await createPresignedUploadUrl(key, parsed.data.contentType);
  return NextResponse.json({ key, url });
}
