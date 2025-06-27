import { describe, it, expect } from "vitest";
import plausibleIntegration from "../../index.ts";
import {
  TEST_DOMAIN,
  TEST_DOMAIN_MULTIPLE,
  TEST_SRC,
  TEST_API_HOST,
  createMockSetupContext,
  mockInjectScript,
} from "./setup.ts";

describe("astro-plausible", () => {
  describe("Basic Functionality", () => {
    it("should export a function", () => {
      expect(typeof plausibleIntegration).toBe("function");
    });

    it("should return an Astro integration object", () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });

      expect(integration).toHaveProperty("name");
      expect(integration).toHaveProperty("hooks");
      expect(integration.name).toBe("astro-plausible");
      expect(typeof integration.hooks).toBe("object");
    });

    it("should have the required Astro hooks", () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const hooks = integration.hooks;

      expect(hooks).toHaveProperty("astro:config:setup");
      expect(typeof hooks["astro:config:setup"]).toBe("function");
    });

    it("should require domain option", () => {
      // @ts-expect-error - Testing runtime behavior without domain
      expect(() => plausibleIntegration({})).toThrow();
    });

    it("should accept valid domain string", () => {
      expect(() => {
        plausibleIntegration({ domain: TEST_DOMAIN });
      }).not.toThrow();
    });

    it("should accept multiple domains", () => {
      expect(() => {
        plausibleIntegration({ domain: TEST_DOMAIN_MULTIPLE });
      }).not.toThrow();
    });
  });

  describe("Configuration Options", () => {
    it("should use default src when not provided", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining("https://plausible.io/js/script.js"),
      );
    });

    it("should use custom src when provided", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        src: TEST_SRC,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(TEST_SRC),
      );
    });

    it("should use default apiHost when not provided", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      // Default apiHost should not appear in script since it's the default
      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).not.toContain('script.setAttribute("data-api"');
    });

    it("should use custom apiHost when provided", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        apiHost: TEST_API_HOST,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(
          `script.setAttribute("data-api", "${TEST_API_HOST}")`,
        ),
      );
    });
  });

  describe("Script Generation", () => {
    it("should inject script with domain attribute", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(
          `script.setAttribute("data-domain", "${TEST_DOMAIN}")`,
        ),
      );
    });

    it("should handle multiple domains", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN_MULTIPLE,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(
          `script.setAttribute("data-domain", "${TEST_DOMAIN_MULTIPLE}")`,
        ),
      );
    });

    it("should include partytown type when withPartytown is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        withPartytown: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(
          'script.setAttribute("type", "text/partytown")',
        ),
      );
    });

    it("should not include partytown type when withPartytown is false", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        withPartytown: false,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).not.toContain(
        'script.setAttribute("type", "text/partytown")',
      );
    });
  });

  describe("Feature Options", () => {
    it("should add data-exclude-hash when excludeHash is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        excludeHash: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(
          'script.setAttribute("data-exclude-hash", "true")',
        ),
      );
    });

    it("should add data-exclude-search when excludeSearch is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        excludeSearch: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining(
          'script.setAttribute("data-exclude-search", "true")',
        ),
      );
    });

    it("should add outbound link tracking when trackOutboundLinks is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackOutboundLinks: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("outbound-links");
    });

    it("should add file download tracking when trackFileDownloads is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackFileDownloads: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("file-downloads");
    });

    it("should enable manual mode when manualMode is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        manualMode: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("manual");
    });
  });

  describe("Development vs Production", () => {
    it("should work in development mode", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("dev");

      await integration.hooks["astro:config:setup"](setupContext);

      expect(mockInjectScript).toHaveBeenCalledWith(
        "head-inline",
        expect.stringContaining("Development mode - tracking disabled"),
      );
    });

    it("should work in production mode", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).not.toContain(
        "Development mode - tracking disabled",
      );
      expect(scriptContent).toContain('script.setAttribute("src"');
    });
  });

  describe("Error Handling", () => {
    it("should handle missing domain gracefully", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        plausibleIntegration({});
      }).toThrow(/domain/i);
    });

    it("should handle empty domain string", () => {
      expect(() => {
        plausibleIntegration({ domain: "" });
      }).toThrow(/domain/i);
    });

    it("should handle null domain", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        plausibleIntegration({ domain: null });
      }).toThrow(/domain/i);
    });
  });
});
