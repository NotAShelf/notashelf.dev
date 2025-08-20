import { describe, it, expect, vi, beforeEach } from "vitest";
import astroEmailObfuscation from "../../index.js";

describe("Configuration Validation", () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Method Validation", () => {
    it("should throw error for invalid obfuscation method", () => {
      expect(() => {
        const integration = astroEmailObfuscation({
          method: "invalid-method" as any,
        });
        // Trigger config setup to validate
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).toThrow("Invalid obfuscation method: invalid-method");
    });

    it("should throw error for invalid method in methods array", () => {
      expect(() => {
        const integration = astroEmailObfuscation({
          methods: ["rot18", "invalid-method" as any],
        });
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).toThrow("Invalid obfuscation method: invalid-method");
    });

    it("should accept all valid obfuscation methods", () => {
      const validMethods = [
        "rot18",
        "js-concat",
        "js-interaction",
        "svg",
        "css-hidden",
        "http-redirect",
        "reverse",
        "base64",
        "deconstruct",
      ];

      expect(() => {
        const integration = astroEmailObfuscation({
          methods: validMethods,
          redirectBaseUrl: "/api/email-redirect", // Required for http-redirect method
        });
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).not.toThrow();
    });
  });

  describe("Target Validation", () => {
    it("should throw error for invalid target", () => {
      expect(() => {
        const integration = astroEmailObfuscation({
          target: "invalid-target" as any,
        });
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).toThrow("Invalid target: invalid-target");
    });

    it("should accept valid targets", () => {
      const validTargets = ["text", "link", "both"];

      validTargets.forEach((target) => {
        expect(() => {
          const integration = astroEmailObfuscation({ target: target as any });
          integration.hooks["astro:config:setup"]({ logger: mockLogger });
        }).not.toThrow();
      });
    });
  });

  describe("HTTP Redirect Validation", () => {
    it("should throw error when http-redirect method is used without redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({ method: "http-redirect" });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });

    it("should throw error when http-redirect method is used with empty redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({
          method: "http-redirect",
          redirectBaseUrl: "",
        });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });

    it("should accept http-redirect method with valid redirectBaseUrl", () => {
      expect(() => {
        astroEmailObfuscation({
          method: "http-redirect",
          redirectBaseUrl: "/api/email",
        });
      }).not.toThrow();
    });

    it("should validate http-redirect in methods array", () => {
      expect(() => {
        astroEmailObfuscation({
          methods: ["rot18", "http-redirect"],
        });
      }).toThrow("redirectBaseUrl is required when using http-redirect method");
    });
  });

  describe("Legacy Method Support", () => {
    it("should handle legacy method option", () => {
      const integration = astroEmailObfuscation({ method: "rot18" });
      integration.hooks["astro:config:setup"]({ logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("methods: [rot18]"),
      );
    });

    it("should prefer methods array over method when both provided", () => {
      const integration = astroEmailObfuscation({
        method: "rot18",
        methods: ["base64", "reverse"],
      });
      integration.hooks["astro:config:setup"]({ logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("methods: [base64, reverse]"),
      );
    });

    it("should use default method when neither method nor methods provided", () => {
      const integration = astroEmailObfuscation({});
      integration.hooks["astro:config:setup"]({ logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("methods: [rot18]"),
      );
    });
  });

  describe("Configuration Logging", () => {
    it("should log configuration details on setup", () => {
      const integration = astroEmailObfuscation({
        methods: ["rot18", "base64"],
        target: "link",
      });
      integration.hooks["astro:config:setup"]({ logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email obfuscation configured with methods: [rot18, base64], target: link",
      );
    });

    it("should log readiness on config done", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const integration = astroEmailObfuscation({});
      integration.hooks["astro:config:done"]({ logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email obfuscation ready for production build",
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("excludeAddresses Option", () => {
    it("should accept excludeAddresses as an array of addresses", () => {
      expect(() => {
        const integration = astroEmailObfuscation({
          methods: ["rot18"],
          excludeAddresses: ["visible@example.com", "support@domain.com"],
        });
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).not.toThrow();
    });

    it("should accept an empty excludeAddresses array", () => {
      expect(() => {
        const integration = astroEmailObfuscation({
          methods: ["rot18"],
          excludeAddresses: [],
        });
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).not.toThrow();
    });

    it("should not throw if excludeAddresses is not set", () => {
      expect(() => {
        const integration = astroEmailObfuscation({
          methods: ["rot18"],
        });
        integration.hooks["astro:config:setup"]({ logger: mockLogger });
      }).not.toThrow();
    });
  });
});
