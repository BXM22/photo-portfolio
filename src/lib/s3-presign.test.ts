import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: vi.fn() }));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildStorageKey, createPresignedUploadUrl } from "@/lib/s3";

describe("createPresignedUploadUrl", () => {
  beforeEach(() => {
    (getSignedUrl as unknown as Mock).mockResolvedValue("https://signed");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("throws when the bucket env var is missing", async () => {
    vi.stubEnv("AWS_S3_BUCKET_NAME", "");
    await expect(createPresignedUploadUrl("k", "image/png")).rejects.toThrow(
      "Missing AWS_S3_BUCKET_NAME",
    );
  });

  it("returns a presigned URL valid for 60 seconds", async () => {
    vi.stubEnv("AWS_S3_BUCKET_NAME", "bucket");
    await expect(createPresignedUploadUrl("k", "image/png")).resolves.toBe(
      "https://signed",
    );
    const [, command, options] = (getSignedUrl as unknown as Mock).mock.calls[0];
    expect(command.input).toEqual({
      Bucket: "bucket",
      Key: "k",
      ContentType: "image/png",
    });
    expect(options).toEqual({ expiresIn: 60 });
  });
});

describe("buildStorageKey extensions", () => {
  it("normalises jpeg to jpg", () => {
    expect(buildStorageKey("a.JPEG")).toMatch(/\.jpg$/);
  });

  it("keeps allowed extensions", () => {
    expect(buildStorageKey("a.webp")).toMatch(/\.webp$/);
  });

  it("defaults unknown extensions to jpg", () => {
    expect(buildStorageKey("a.exe")).toMatch(/\.jpg$/);
    expect(buildStorageKey("noext")).toMatch(/\.jpg$/);
  });
});
