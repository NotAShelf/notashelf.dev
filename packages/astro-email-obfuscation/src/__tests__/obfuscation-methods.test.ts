import { describe, it, expect } from "vitest";
import astroEmailObfuscation from "../../index.js";

describe("Obfuscation Methods", () => {
  it("should configure all standard obfuscation methods", () => {
    const methods = [
      "rot18",
      "js-concat",
      "js-interaction",
      "svg",
      "css-hidden",
      "reverse",
      "base64",
      "deconstruct",
    ];

    methods.forEach((method) => {
      const integration = astroEmailObfuscation({ method: method as any });
      expect(integration.name).toBe("astro-email-obfuscation");
      expect(integration.hooks).toHaveProperty("astro:build:done");
    });
  });

  describe("HTTP Redirect Method", () => {
    it("should configure http-redirect with valid redirectBaseUrl", () => {
      const integration = astroEmailObfuscation({
        method: "http-redirect",
        redirectBaseUrl: "/api/email-redirect",
      });
      expect(integration.name).toBe("astro-email-obfuscation");
    });

    it("should throw error for http-redirect without redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({ method: "http-redirect" });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });

    it("should throw error for http-redirect with empty redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({
          method: "http-redirect",
          redirectBaseUrl: "",
        });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });
  });

  describe("Layered Obfuscation", () => {
    it("should support multiple methods in sequence", () => {
      const integration = astroEmailObfuscation({
        methods: ["reverse", "base64", "rot18"],
      });
      expect(integration.name).toBe("astro-email-obfuscation");
    });

    it("should handle http-redirect in method chain with redirectBaseUrl", () => {
      const integration = astroEmailObfuscation({
        methods: ["reverse", "http-redirect"],
        redirectBaseUrl: "/api/redirect",
      });
      expect(integration.name).toBe("astro-email-obfuscation");
    });

    it("should validate http-redirect in methods array requires redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({
          methods: ["reverse", "http-redirect"],
        });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });
  });

  describe("Target Processing", () => {
    it("should handle all target processing options", () => {
      const targets = ["text", "link", "both"];
      targets.forEach((target) => {
        const integration = astroEmailObfuscation({
          method: "rot18",
          target: target as any,
        });
        expect(integration.name).toBe("astro-email-obfuscation");
      });
    });
  });
});
