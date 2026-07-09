import { describe, expect, it } from "vitest";

import {
  andThen,
  collect,
  err,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  type Result,
  unwrapOr,
} from "./result";

describe("Result primitives", () => {
  it("ok/err construct discriminated variants", () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });

  it("isOk/isErr narrow both variants", () => {
    const good: Result<number, string> = ok(1);
    const bad: Result<number, string> = err("x");
    expect(isOk(good)).toBe(true);
    expect(isOk(bad)).toBe(false);
    expect(isErr(good)).toBe(false);
    expect(isErr(bad)).toBe(true);
  });

  it("map transforms Ok and passes Err through", () => {
    expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
    expect(map(err<string>("e"), (n: number) => n * 3)).toEqual(err("e"));
  });

  it("mapErr transforms Err and passes Ok through", () => {
    expect(mapErr(err("e"), (s) => `${s}!`)).toEqual(err("e!"));
    expect(mapErr(ok<number>(2), (s: string) => `${s}!`)).toEqual(ok(2));
  });

  it("andThen chains Ok and short-circuits Err", () => {
    const half = (n: number): Result<number, string> =>
      n % 2 === 0 ? ok(n / 2) : err("odd");
    expect(andThen(ok(8), half)).toEqual(ok(4));
    expect(andThen(ok(7), half)).toEqual(err("odd"));
    expect(andThen(err<string>("pre"), half)).toEqual(err("pre"));
  });

  it("unwrapOr returns value or fallback", () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err<string>("e"), 0)).toBe(0);
  });

  it("collect sequences and short-circuits on the first Err", () => {
    expect(collect([ok(1), ok(2), ok(3)])).toEqual(ok([1, 2, 3]));
    expect(collect([ok(1), err("bad"), ok(3)])).toEqual(err("bad"));
    expect(collect<number, string>([])).toEqual(ok([]));
  });
});
