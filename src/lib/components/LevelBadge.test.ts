import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import LevelBadge from "./LevelBadge.svelte";

describe("LevelBadge", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders no badge when the level is null", () => {
    const component = mount(LevelBadge, { target, props: { level: null } });
    expect(target.querySelector(".level-badge")).toBeNull();
    void unmount(component);
  });

  it("renders a defined level key with its meaning as the title", () => {
    const component = mount(LevelBadge, { target, props: { level: "teach" } });
    const badge = target.querySelector(".level-badge");
    expect(badge?.textContent).toBe("teach");
    expect(badge?.getAttribute("title")).toContain("teach a workshop");
    void unmount(component);
  });
});
