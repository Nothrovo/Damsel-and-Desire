import { describe, it, expect } from "vitest";
import {
  resolvePortraitUrl,
  getAppBaseUrl,
  getLocalPortraitUrl,
  BUNDLED_PORTRAIT_SLUGS,
  SUPABASE_STORAGE_PORTRAITS_URL
} from "../src/api/codex";

describe("Portrait Resolution & CDN Fallback Engine", () => {
  it("defines all 32 bundled canon character portrait slugs", () => {
    expect(BUNDLED_PORTRAIT_SLUGS.size).toBe(32);
    expect(BUNDLED_PORTRAIT_SLUGS.has("kisaragi_setsuna")).toBe(true);
    expect(BUNDLED_PORTRAIT_SLUGS.has("sendou_airi")).toBe(true);
    expect(BUNDLED_PORTRAIT_SLUGS.has("miruam_solari")).toBe(true);
    expect(BUNDLED_PORTRAIT_SLUGS.has("hoshina_nayu")).toBe(true);
  });

  it("resolves relative /portraits/... path using the app base URL", () => {
    const resolved = resolvePortraitUrl("/portraits/kisaragi_setsuna.png");
    const base = getAppBaseUrl();
    expect(resolved).toBe(`${base}portraits/kisaragi_setsuna.png`);
  });

  it("resolves bundled portrait when rawUrl is empty but valid slug is provided", () => {
    const resolved = resolvePortraitUrl("", "hoshina_nayu");
    const base = getAppBaseUrl();
    expect(resolved).toBe(`${base}portraits/hoshina_nayu.png`);
  });

  it("upgrades DiceBear url to bundled portrait if slug is a bundled canon character", () => {
    const dicebearUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=sendou_airi";
    const resolved = resolvePortraitUrl(dicebearUrl, "sendou_airi");
    const base = getAppBaseUrl();
    expect(resolved).toBe(`${base}portraits/sendou_airi.png`);
  });

  it("preserves DiceBear url if character is NOT in bundled portrait list", () => {
    const dicebearUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=fujiwara_kenji";
    const resolved = resolvePortraitUrl(dicebearUrl, "fujiwara_kenji");
    expect(resolved).toBe(dicebearUrl);
  });

  it("preserves Supabase Storage custom uploaded avatar URLs", () => {
    const storageUrl = "https://oavkhnjigdqacvqfkzpf.supabase.co/storage/v1/object/public/codex-assets/player-avatars/custom_player_1.png";
    const resolved = resolvePortraitUrl(storageUrl, "custom_char");
    expect(resolved).toBe(storageUrl);
  });

  it("preserves inline base64 Data URLs", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const resolved = resolvePortraitUrl(dataUrl);
    expect(resolved).toBe(dataUrl);
  });

  it("returns empty string when both rawUrl and slug are empty or null", () => {
    expect(resolvePortraitUrl(null, null)).toBe("");
    expect(resolvePortraitUrl("", "")).toBe("");
    expect(resolvePortraitUrl(undefined, undefined)).toBe("");
  });
});
