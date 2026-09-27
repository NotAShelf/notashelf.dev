import { describe, expect, it, vi } from "vitest";
import astroEmailObfuscation from "../../index.js";

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

describe("configuration errors", () => {
  it("rejects unknown methods during Astro setup", () => {
    const integration = astroEmailObfuscation({
      methods: ["rot18", "unknown" as "rot18"],
    });
    expect(() =>
      integration.hooks["astro:config:setup"]!({ logger } as never),
    ).toThrow("Invalid obfuscation method: unknown");
  });

  it("rejects unknown processing targets during Astro setup", () => {
    const integration = astroEmailObfuscation({ target: "unknown" as "both" });
    expect(() =>
      integration.hooks["astro:config:setup"]!({ logger } as never),
    ).toThrow("Invalid target: unknown");
  });

  it("rejects an empty methods list rather than leaving email addresses exposed", () => {
    const integration = astroEmailObfuscation({ methods: [] });
    expect(() =>
      integration.hooks["astro:config:setup"]!({ logger } as never),
    ).toThrow("At least one obfuscation method is required");
  });

  it("requires an endpoint when http-redirect is selected", () => {
    expect(() =>
      astroEmailObfuscation({ methods: ["rot18", "http-redirect"] }),
    ).toThrow("redirectBaseUrl is required when using http-redirect method");
  });
});
