import { describe, it, expect } from "vitest";
import plausibleIntegration from "../../index.ts";
import {
  TEST_DOMAIN,
  TEST_SRC,
  TEST_API_HOST,
  createMockSetupContext,
  mockInjectScript,
} from "./setup.ts";

describe("astro-plausible - Script Generation", () => {
  describe("Basic Script Structure", () => {
    it("should generate a valid JavaScript function", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("(function () {");
      expect(scriptContent).toContain("})()");
    });

    it("should include domain in script creation", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        `script.setAttribute("data-domain", "${TEST_DOMAIN}")`,
      );
    });

    it("should include src attribute", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        src: TEST_SRC,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        `script.setAttribute("src", "${TEST_SRC}")`,
      );
    });

    it("should be deferred by default", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain('script.setAttribute("defer", true)');
    });
  });

  describe("Script Extensions", () => {
    it("should add outbound-links extension", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackOutboundLinks: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("outbound-links");
    });

    it("should add file-downloads extension", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackFileDownloads: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("file-downloads");
    });

    it("should add hash extension for hash routing", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackHashBasedRouting: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("hash");
    });

    it("should add multiple extensions", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackOutboundLinks: true,
        trackFileDownloads: true,
        track404: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("outbound-links");
      expect(scriptContent).toContain("file-downloads");
      expect(scriptContent).toContain("404");
    });
  });

  describe("Data Attributes", () => {
    it("should add data-api attribute when apiHost is provided", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        apiHost: TEST_API_HOST,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        `script.setAttribute("data-api", "${TEST_API_HOST}")`,
      );
    });

    it("should add data-exclude-hash when excludeHash is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        excludeHash: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        'script.setAttribute("data-exclude-hash", "true")',
      );
    });

    it("should add data-exclude-search when excludeSearch is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        excludeSearch: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        'script.setAttribute("data-exclude-search", "true")',
      );
    });

    it("should not add data-manual attribute when manualMode is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        manualMode: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      // Manual mode is handled via script URL, not data attribute
      expect(scriptContent).toContain("manual");
    });

    it("should add custom file types when customFileTypes is provided", async () => {
      const customTypes = "pdf,doc,zip";
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        customFileTypes: customTypes,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        `script.setAttribute("file-types", "${customTypes}")`,
      );
    });

    it("should add additional file types when additionalFileTypes is provided", async () => {
      const additionalTypes = "js,py,rs";
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        additionalFileTypes: additionalTypes,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        `script.setAttribute("add-file-types", "${additionalTypes}")`,
      );
    });
  });

  describe("Partytown Integration", () => {
    it("should add partytown type when withPartytown is true", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        withPartytown: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        'script.setAttribute("type", "text/partytown")',
      );
    });

    it("should not add partytown type when withPartytown is false", async () => {
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

    it("should not add partytown type by default", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).not.toContain(
        'script.setAttribute("type", "text/partytown")',
      );
    });
  });

  describe("Script URL Building", () => {
    it("should use default script URL when no options provided", async () => {
      const integration = plausibleIntegration({ domain: TEST_DOMAIN });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain("https://plausible.io/js/script.js");
    });

    it("should build script URL with extensions", async () => {
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        trackOutboundLinks: true,
        trackFileDownloads: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      // Should contain both extensions in the URL
      expect(scriptContent).toMatch(
        /script\.(file-downloads\.)?.*?(outbound-links\.)?.*?js/,
      );
    });

    it("should preserve custom src URL when extensions are used", async () => {
      const customSrc = "https://analytics.example.com/js/script.js";
      const integration = plausibleIntegration({
        domain: TEST_DOMAIN,
        src: customSrc,
        trackOutboundLinks: true,
      });
      const setupContext = createMockSetupContext("build");

      await integration.hooks["astro:config:setup"](setupContext);

      const scriptContent = mockInjectScript.mock.calls[0][1];
      expect(scriptContent).toContain(
        customSrc.replace(".js", ".outbound-links.js"),
      );
    });
  });
});
