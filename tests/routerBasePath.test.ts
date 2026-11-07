import { describe, expect, it, beforeEach } from "vitest";
import { router } from "../src/router/router";
import { buildAuthCallbackUrl, resolveInternalRedirect } from "../src/router/routeAccess";

describe("Router Base Path & Case Insensitivity", () => {
  beforeEach(() => {
    (globalThis as any).window = {
      location: {
        pathname: "/",
        search: "",
        origin: "https://nothrovo.github.io"
      },
      history: {
        pushState: () => {},
        replaceState: () => {}
      },
      addEventListener: () => {}
    };
  });

  it("identifies uppercase /Damsel-and-Desire base path from location", () => {
    (globalThis as any).window.location.pathname = "/Damsel-and-Desire/";
    expect((router as any).getBasePath()).toBe("/Damsel-and-Desire");

    (globalThis as any).window.location.pathname = "/Damsel-and-Desire/codex";
    expect((router as any).getBasePath()).toBe("/Damsel-and-Desire");
  });

  it("normalizes case variations (e.g. lowercase /damsel-and-desire) to canonical base", () => {
    (globalThis as any).window.location.pathname = "/damsel-and-desire/characters";
    expect((router as any).getBasePath()).toBe("/Damsel-and-Desire");
  });

  it("normalizes incoming full paths correctly regardless of base casing", () => {
    (globalThis as any).window.location.pathname = "/Damsel-and-Desire/codex";
    expect((router as any).normalizePath("/Damsel-and-Desire/codex")).toBe("/codex");
    expect((router as any).normalizePath("/damsel-and-desire/codex")).toBe("/codex");
    expect((router as any).normalizePath("/Damsel-and-Desire")).toBe("/");
    expect((router as any).normalizePath("/Damsel-and-Desire/")).toBe("/");
  });

  it("formats full paths with uppercase /Damsel-and-Desire base", () => {
    (globalThis as any).window.location.pathname = "/Damsel-and-Desire/";
    expect((router as any).formatFullPath("/codex")).toBe("/Damsel-and-Desire/codex");
    expect((router as any).formatFullPath("/")).toBe("/Damsel-and-Desire/");
  });

  it("supports internal redirect resolution with case tolerance", () => {
    expect(resolveInternalRedirect("/Damsel-and-Desire/codex", "/Damsel-and-Desire")).toBe("/codex");
    expect(resolveInternalRedirect("/damsel-and-desire/codex", "/Damsel-and-Desire")).toBe("/codex");
    expect(buildAuthCallbackUrl("/codex", "https://nothrovo.github.io", "/Damsel-and-Desire")).toBe(
      "https://nothrovo.github.io/Damsel-and-Desire/codex"
    );
  });
});
