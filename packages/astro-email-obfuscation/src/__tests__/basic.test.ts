import { describe, it, expect } from "vitest";
import astroEmailObfuscation from "../../index.js";
import type { ObfuscationMethod } from "../../index.js";

describe("astro-email-obfuscation", () => {
  describe("Basic Functionality", () => {
    it("should export a function", () => {
      expect(typeof astroEmailObfuscation).toBe("function");
    });

    it("should return an Astro integration object", () => {
      const integration = astroEmailObfuscation();

      expect(integration).toHaveProperty("name");
      expect(integration).toHaveProperty("hooks");
      expect(integration.name).toBe("astro-email-obfuscation");
      expect(typeof integration.hooks).toBe("object");
    });

    it("should have the required Astro hooks", () => {
      const integration = astroEmailObfuscation();
      const hooks = integration.hooks;

      expect(hooks).toHaveProperty("astro:config:setup");
      expect(hooks).toHaveProperty("astro:config:done");
      expect(hooks).toHaveProperty("astro:build:done");

      expect(typeof hooks["astro:config:setup"]).toBe("function");
      expect(typeof hooks["astro:config:done"]).toBe("function");
      expect(typeof hooks["astro:build:done"]).toBe("function");
    });

    it("should use default options when no options provided", () => {
      const integration = astroEmailObfuscation();

      // We can't directly access the options, but we can verify the integration
      // was created without throwing an error
      expect(integration.name).toBe("astro-email-obfuscation");
    });

    it("should handle empty options object", () => {
      const integration = astroEmailObfuscation({});

      expect(integration.name).toBe("astro-email-obfuscation");
    });

    it("should accept valid obfuscation methods", () => {
      const validMethods: ObfuscationMethod[] = ["rot18", "base64", "reverse"];

      expect(() => {
        astroEmailObfuscation({ methods: validMethods });
      }).not.toThrow();
    });

    it("should handle legacy method option", () => {
      expect(() => {
        astroEmailObfuscation({ method: "rot18" });
      }).not.toThrow();
    });
  });

  describe("Configuration Validation", () => {
    it("should accept all valid obfuscation methods", () => {
      const validMethods = [
        "rot18",
        "js-concat",
        "js-interaction",
        "svg",
        "css-hidden",
        "reverse",
        "base64",
        "deconstruct",
        "http-redirect",
      ];

      validMethods.forEach((method) => {
        const options =
          method === "http-redirect"
            ? { method, redirectBaseUrl: "/redirect" }
            : { method };

        expect(() => astroEmailObfuscation(options as any)).not.toThrow();
      });
    });

    it("should throw error for http-redirect method without redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({ method: "http-redirect" });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });
  });

  describe("Integration Properties", () => {
    it("should return proper integration object structure", () => {
      const integration = astroEmailObfuscation({ method: "rot18" });

      expect(integration).toHaveProperty("name", "astro-email-obfuscation");
      expect(integration).toHaveProperty("hooks");
      expect(integration.hooks).toHaveProperty("astro:build:done");
      expect(typeof integration.hooks["astro:build:done"]).toBe("function");
    });
  });

  describe("Advanced Configuration Options", () => {
    it("should support all configuration options", () => {
      const validConfigs = [
        { methods: ["reverse", "base64", "rot18"] },
        { method: "rot18", target: "text" },
        { method: "rot18", target: "link" },
        { method: "rot18", target: "both" },
        { method: "rot18", dev: true },
        { method: "js-interaction", placeholder: "Custom text" },
        { method: "svg", includeFallbacks: false },
        { method: "rot18", excludeSelector: ".no-obfuscate" },
        { method: "http-redirect", redirectBaseUrl: "/api/redirect" },
      ];

      validConfigs.forEach((config) => {
        expect(() => astroEmailObfuscation(config as any)).not.toThrow();
      });
    });
  });
});
