// normalizePem — reconstruct a usable PEM from a secrets-manager-mangled
// key, per the wrapper's newline contract in SPECIFICATION/
// non-functional-requirements.md §"Local secret injection" and
// .github/README.md §"Local secret injection".
//
// Why this exists: `op run` (the with-resume-env.sh wrapper's injection
// path) delivers a multiline secret such as GITHUB_APP_PRIVATE_KEY
// FLATTENED to a single line — the newlines are stripped regardless of how
// the key is stored in the 1Password Environment (empirically verified:
// the injected value carries zero newlines, with -----BEGIN…----- jammed
// directly against the base64 body). openssl and other PEM parsers reject
// that raw value ("Could not find private key"). This is the same
// malformed-key failure mode the livespec fleet hit; the standalone
// realization of its `normalize_pem` fix lives here so any local consumer
// of a wrapper-injected key normalizes before use.
//
// Accepted mangled forms (all recovered):
//   - real newlines            -> passed through (trailing newline ensured)
//   - literal backslash-n      -> converted to real newlines
//   - flattened to one line    -> base64 body de-whitespaced and re-wrapped
//     (spaces between chunks, or no separator at all)
// A non-PEM single-line string is returned unchanged.

// Matches BEGIN <label> / body / END <label>. No end anchor: any trailing
// content after the END marker is dropped, mirroring the reference
// implementation. The base64 body never contains "-----", so the greedy
// body capture backtracks to the real END marker.
const FLATTENED_PEM =
  /^(-----BEGIN [A-Z0-9 ]+-----)(.*)(-----END [A-Z0-9 ]+-----)/;

export function normalizePem(raw: string): string {
  const text = raw.replace(/\\n/g, "\n").trim();
  if (text.includes("\n")) {
    return `${text}\n`;
  }
  const match = FLATTENED_PEM.exec(text);
  if (match === null) {
    return text;
  }
  const begin = match[1] ?? "";
  const body = match[2] ?? "";
  const end = match[3] ?? "";
  const compact = body.replace(/\s+/g, "");
  const wrapped: string[] = [];
  for (let i = 0; i < compact.length; i += 64) {
    wrapped.push(compact.slice(i, i + 64));
  }
  return `${begin}\n${wrapped.join("\n")}\n${end}\n`;
}
