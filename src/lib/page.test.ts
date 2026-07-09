import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("loadResumeOrError", () => {
  it("returns the transformed resume data on success", async () => {
    const { loadResumeOrError } = await import("./page");
    const data = loadResumeOrError();
    expect(data.sections).toHaveLength(16);
    expect(data.items).toHaveLength(74);
  });

  it("throws a visitor-safe error (no raw detail) when the source is malformed", async () => {
    vi.doMock("./data/resume", () => ({
      loadResumeData: () => ({
        ok: false,
        error: { kind: "missing-about" },
      }),
    }));
    const { loadResumeOrError } = await import("./page");
    let thrown: unknown;
    try {
      loadResumeOrError();
    } catch (caught: unknown) {
      thrown = caught;
    }
    expect(thrown).toBeDefined();
    const body = (thrown as { body?: { message?: string } }).body;
    expect(body?.message).toContain("résumé data is incomplete");
  });
});
