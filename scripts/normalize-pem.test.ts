// Harness test for normalizePem (the wrapper's
// newline contract). Pins the reconstruction of a usable PEM from the
// forms a secrets manager / op-run injection delivers — real newlines,
// literal backslash-n, and (the observed op-run failure mode) a key
// flattened onto a single line — per SPECIFICATION/
// non-functional-requirements.md §"Local secret injection".

import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { normalizePem } from "./normalize-pem";

describe("normalizePem", () => {
  test("passes a real-newline PEM through (trailing newline ensured)", () => {
    const pem =
      "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj3\n-----END RSA PRIVATE KEY-----";
    expect(normalizePem(pem)).toBe(`${pem}\n`);
  });

  test("converts literal backslash-n to real newlines", () => {
    const raw = "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----";
    expect(normalizePem(raw)).toBe(
      "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n",
    );
  });

  test("re-wraps a flattened single line separated by spaces", () => {
    const body = "A".repeat(100);
    const flat = `-----BEGIN PRIVATE KEY----- ${body} -----END PRIVATE KEY-----`;
    const lines = normalizePem(flat).split("\n");
    expect(lines[0]).toBe("-----BEGIN PRIVATE KEY-----");
    expect(lines[1]).toBe("A".repeat(64));
    expect(lines[2]).toBe("A".repeat(36));
    expect(lines[3]).toBe("-----END PRIVATE KEY-----");
  });

  test("re-wraps the op-run form: markers jammed against the body, no spaces", () => {
    const body = "B".repeat(130);
    const flat = `-----BEGIN RSA PRIVATE KEY-----${body}-----END RSA PRIVATE KEY-----`;
    const result = normalizePem(flat);
    const lines = result.split("\n");
    expect(lines[0]).toBe("-----BEGIN RSA PRIVATE KEY-----");
    expect(lines[1]).toBe("B".repeat(64));
    expect(lines[2]).toBe("B".repeat(64));
    expect(lines[3]).toBe("B".repeat(2));
    expect(lines[4]).toBe("-----END RSA PRIVATE KEY-----");
    expect(result.endsWith("-----END RSA PRIVATE KEY-----\n")).toBe(true);
  });

  test("returns a non-PEM single-line string unchanged", () => {
    expect(normalizePem("not a pem at all")).toBe("not a pem at all");
  });

  // Real-world proof: a genuine RSA key flattened exactly as op-run
  // delivers it (all newlines stripped) is rejected by openssl raw, and
  // loads cleanly after normalizePem. Skips gracefully where openssl is
  // unavailable; CI (ubuntu) and macOS both ship it.
  test("recovers a flattened real RSA key that openssl then loads", () => {
    const openssl = Bun.which("openssl");
    if (openssl === null) {
      return;
    }
    const gen = spawnSync(openssl, ["genrsa", "2048"], { encoding: "utf8" });
    expect(gen.status).toBe(0);
    const pem = gen.stdout.trim();
    const flattened = pem.replace(/\n/g, "");

    const dir = mkdtempSync(join(tmpdir(), "resume-pem-"));
    try {
      const rawPath = join(dir, "raw.pem");
      const normPath = join(dir, "norm.pem");
      writeFileSync(rawPath, flattened);
      writeFileSync(normPath, normalizePem(flattened));

      const rawCheck = spawnSync(openssl, [
        "rsa",
        "-in",
        rawPath,
        "-noout",
        "-check",
      ]);
      expect(rawCheck.status).not.toBe(0);

      const normCheck = spawnSync(openssl, [
        "rsa",
        "-in",
        normPath,
        "-noout",
        "-check",
      ]);
      expect(normCheck.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
