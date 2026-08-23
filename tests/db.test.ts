import { describe, expect, it } from "vitest";
import { normalizeDatabaseError, normalizeDatabaseUrl } from "@/lib/db";

describe("normalizeDatabaseUrl", () => {
  it("évite la résolution IPv4/IPv6 multiple de localhost", () => {
    expect(normalizeDatabaseUrl("postgres://postgres:postgres@localhost:55432/luma_store"))
      .toBe("postgres://postgres:postgres@127.0.0.1:55432/luma_store");
  });

  it("ne modifie pas les hôtes distants", () => {
    expect(normalizeDatabaseUrl("postgres://user:secret@db.example.test:5432/store"))
      .toBe("postgres://user:secret@db.example.test:5432/store");
  });
});

describe("normalizeDatabaseError", () => {
  it("rend une erreur de connexion multiple sérialisable pour Next.js", () => {
    const connectionError = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:55432"), {
      code: "ECONNREFUSED"
    });
    const normalized = normalizeDatabaseError(new AggregateError([connectionError]));

    expect(normalized).not.toBeInstanceOf(AggregateError);
    expect(normalized.name).toBe("DatabaseError");
    expect(normalized.message).toContain("ECONNREFUSED");
    expect(normalized.code).toBe("ECONNREFUSED");
  });

  it("conserve les erreurs PostgreSQL simples et leur code", () => {
    const uniqueViolation = Object.assign(new Error("duplicate key"), { code: "23505" });

    expect(normalizeDatabaseError(uniqueViolation)).toBe(uniqueViolation);
  });
});
