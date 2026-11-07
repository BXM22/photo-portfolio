import { describe, expect, it } from "vitest";
import { z } from "zod";
import { conflict, notFound, parseJson } from "@/lib/api";

const schema = z.object({ name: z.string().min(1) });

function jsonRequest(body: string) {
  return new Request("http://localhost/x", { method: "POST", body });
}

describe("parseJson", () => {
  it("returns parsed data for valid input", async () => {
    const result = await parseJson(jsonRequest('{"name":"a"}'), schema);
    expect(result).toEqual({ data: { name: "a" } });
  });

  it("returns 400 for malformed JSON", async () => {
    const result = await parseJson(jsonRequest("{nope"), schema);
    if (!("error" in result)) throw new Error("expected error");
    expect(result.error.status).toBe(400);
    await expect(result.error.json()).resolves.toEqual({
      error: "Invalid JSON",
    });
  });

  it("returns 400 with issues when schema validation fails", async () => {
    const result = await parseJson(jsonRequest('{"name":""}'), schema);
    if (!("error" in result)) throw new Error("expected error");
    expect(result.error.status).toBe(400);
    const body = await result.error.json();
    expect(body.error).toBe("Invalid input");
    expect(body.issues).toHaveLength(1);
  });
});

describe("response helpers", () => {
  it("conflict returns 409", async () => {
    const res = conflict();
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "Conflict" });
  });

  it("notFound returns 404", async () => {
    const res = notFound();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });
});
