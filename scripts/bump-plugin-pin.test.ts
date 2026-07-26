// Unit tests for the Claude plugin pin bumper.

import { describe, expect, test } from "bun:test";

import { bumpPin } from "./bump-plugin-pin";

const settings = (refs: Record<string, string>): string =>
  JSON.stringify(
    {
      hooks: { SessionStart: [] },
      enabledPlugins: Object.fromEntries(
        Object.keys(refs).map((name) => [`${name}@${name}`, true]),
      ),
      extraKnownMarketplaces: Object.fromEntries(
        Object.entries(refs).map(([name, ref]) => [
          name,
          { source: { source: "github", repo: `thewoolleyman/${name}`, ref } },
        ]),
      ),
    },
    null,
    2,
  );

function refOf(text: string, name: string): string {
  const parsed = JSON.parse(text) as {
    extraKnownMarketplaces: Record<string, { source: { ref: string } }>;
  };
  return parsed.extraKnownMarketplaces[name]?.source.ref ?? "";
}

describe("bumpPin", () => {
  test("advances a concrete tag pin to the released tag", () => {
    const result = bumpPin({
      settingsText: settings({ "livespec-overseer": "v0.12.2" }),
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    });
    expect(result.changed).toEqual([
      { marketplace: "livespec-overseer", from: "v0.12.2", to: "v0.12.3" },
    ]);
    expect(refOf(result.settingsText, "livespec-overseer")).toBe("v0.12.3");
  });

  test("NEVER rewrites a branch ref", () => {
    // A `release` pin auto-follows every published release. Rewriting it to a
    // concrete tag would freeze a consumer that is meant to track the channel,
    // silently converting a released posture into a pinned one.
    const result = bumpPin({
      settingsText: settings({ "livespec-overseer": "release" }),
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    });
    expect(result.changed).toEqual([]);
    expect(refOf(result.settingsText, "livespec-overseer")).toBe("release");
  });

  test("leaves other marketplaces untouched", () => {
    const result = bumpPin({
      settingsText: settings({
        livespec: "v0.7.3",
        "livespec-overseer": "v0.12.2",
      }),
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    });
    expect(result.changed.map((c) => c.marketplace)).toEqual([
      "livespec-overseer",
    ]);
    expect(refOf(result.settingsText, "livespec")).toBe("v0.7.3");
  });

  test("matches the repo by its full name, not a substring", () => {
    // `livespec` must not match `livespec-overseer`; a naive `includes` would
    // bump every marketplace whose repo name starts with the source name.
    const result = bumpPin({
      settingsText: settings({
        livespec: "v0.7.3",
        "livespec-overseer": "v0.12.2",
      }),
      sourceRepo: "livespec",
      tag: "v0.8.0",
    });
    expect(result.changed.map((c) => c.marketplace)).toEqual(["livespec"]);
    expect(refOf(result.settingsText, "livespec-overseer")).toBe("v0.12.2");
  });

  test("is a no-op when the pin already names the released tag", () => {
    const result = bumpPin({
      settingsText: settings({ "livespec-overseer": "v0.12.3" }),
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    });
    expect(result.changed).toEqual([]);
  });

  test("preserves the rest of the file byte for byte", () => {
    // The committed file is kept in the shape the plugin CLI writes, so a
    // reserialize here would dirty the tree on every provisioning run.
    const before = settings({
      livespec: "v0.7.3",
      "livespec-overseer": "v0.12.2",
    });
    const after = bumpPin({
      settingsText: before,
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    }).settingsText;
    expect(after).toBe(before.replace('"v0.12.2"', '"v0.12.3"'));
  });

  test("reports no change for an unknown source repo", () => {
    const result = bumpPin({
      settingsText: settings({ "livespec-overseer": "v0.12.2" }),
      sourceRepo: "not-a-marketplace",
      tag: "v9.9.9",
    });
    expect(result.changed).toEqual([]);
  });

  test("refuses a tag that is not a concrete version", () => {
    // A dispatch payload carrying a branch name would otherwise pin every
    // consumer to a moving ref under the guise of a bump.
    for (const tag of ["release", "master", "", "latest"]) {
      const result = bumpPin({
        settingsText: settings({ "livespec-overseer": "v0.12.2" }),
        sourceRepo: "livespec-overseer",
        tag,
      });
      expect(result.changed).toEqual([]);
      expect(result.rejectedTag).toBe(true);
    }
  });

  test("tolerates a settings file with no marketplaces", () => {
    const result = bumpPin({
      settingsText: JSON.stringify({ hooks: {} }),
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    });
    expect(result.changed).toEqual([]);
  });

  test("tolerates malformed settings without throwing", () => {
    const result = bumpPin({
      settingsText: "not json",
      sourceRepo: "livespec-overseer",
      tag: "v0.12.3",
    });
    expect(result.changed).toEqual([]);
    expect(result.settingsText).toBe("not json");
  });
});
