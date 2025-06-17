import { describe, it, expect } from "vitest";
import plausibleIntegration from "../../index.ts";
import {
  TEST_DOMAIN,
  createMockSetupContext,
  mockInjectScript,
} from "./setup.ts";

describe("astro-plausible - Configuration Validation", () => {
  describe("Domain Configuration", () => {
    it("should accept single domain", () => {
      expect(() => {
        plausibleIntegration({ domain: "example.com" });
      }).not.toThrow();
    });

    it("should accept multiple domains", () => {
      expect(() => {
        plausibleIntegration({ domain: "example.com,app.example.com" });
      }).not.toThrow();
    });

    it("should accept domains with subdomains", () => {
      expect(() => {
        plausibleIntegration({ domain: "subdomain.example.com" });
      }).not.toThrow();
    });

    it("should reject empty domain", () => {
      expect(() => {
        plausibleIntegration({ domain: "" });
      }).toThrow();
    });
  });

  describe("URL Configuration", () => {
    it("should accept valid HTTP URLs", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          src: "http://analytics.example.com/js/script.js",
        });
      }).not.toThrow();
    });

    it("should accept valid HTTPS URLs", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          src: "https://analytics.example.com/js/script.js",
        });
      }).not.toThrow();
    });

    it("should accept relative URLs", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          src: "/js/script.js",
        });
      }).not.toThrow();
    });
  });

  describe("Boolean Options", () => {
    const booleanOptions = [
      "trackOutboundLinks",
      "trackFileDownloads",
      "track404",
      "trackHashBasedRouting",
      "enableCustomEvents",
      "enableCustomProperties",
      "enableEcommerce",
      "excludeHash",
      "excludeSearch",
      "manualMode",
      "withPartytown",
    ] as const;

    booleanOptions.forEach((option) => {
      it(`should accept true for ${option}`, () => {
        expect(() => {
          plausibleIntegration({
            domain: TEST_DOMAIN,
            [option]: true,
          });
        }).not.toThrow();
      });

      it(`should accept false for ${option}`, () => {
        expect(() => {
          plausibleIntegration({
            domain: TEST_DOMAIN,
            [option]: false,
          });
        }).not.toThrow();
      });
    });
  });

  describe("Array Options", () => {
    it("should accept valid allowedDomains array", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          allowedDomains: ["example.com", "app.example.com"],
        });
      }).not.toThrow();
    });

    it("should accept empty allowedDomains array", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          allowedDomains: [],
        });
      }).not.toThrow();
    });

    it("should accept valid excludePaths array", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          excludePaths: ["/admin/*", "/dashboard/*"],
        });
      }).not.toThrow();
    });
  });

  describe("String Options", () => {
    it("should accept custom file types", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          customFileTypes: "pdf,doc,zip",
        });
      }).not.toThrow();
    });

    it("should accept additional file types", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          additionalFileTypes: "js,py,rs",
        });
      }).not.toThrow();
    });

    it("should accept empty string for file types", () => {
      expect(() => {
        plausibleIntegration({
          domain: TEST_DOMAIN,
          customFileTypes: "",
        });
      }).not.toThrow();
    });
  });

  describe("Complex Configuration", () => {
    it("should accept complex valid configuration", () => {
      expect(() => {
        plausibleIntegration({
          domain: "example.com,app.example.com",
          src: "https://analytics.example.com/js/script.js",
          apiHost: "https://analytics.example.com/api/event",
          trackOutboundLinks: true,
          trackFileDownloads: true,
          track404: true,
          enableCustomEvents: true,
          enableCustomProperties: true,
          excludeHash: true,
          excludeSearch: false,
          manualMode: false,
          withPartytown: true,
          allowedDomains: ["example.com"],
          excludePaths: ["/admin/*"],
          customFileTypes: "pdf,doc",
          additionalFileTypes: "py,rs",
        });
      }).not.toThrow();
    });

    it("should generate correct script with complex configuration", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackOutboundLinks: true,
        trackFileDownloads: true,
        excludeHash: true,
        withPartytown: true,
      });

      const setupContext = createMockSetupContext("build");
      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];

      expect(scriptContent).toContain(
        'script.setAttribute("data-domain", "example.com")',
      );
      expect(scriptContent).toContain(
        'script.setAttribute("data-exclude-hash", "true")',
      );
      expect(scriptContent).toContain(
        'script.setAttribute("type", "text/partytown")',
      );
      expect(scriptContent).toContain("outbound-links");
      expect(scriptContent).toContain("file-downloads");
    });
  });
});
