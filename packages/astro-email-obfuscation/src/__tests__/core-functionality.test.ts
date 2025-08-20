import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const { mockFs, mockPath, mockFileURLToPath } = vi.hoisted(() => ({
  mockFs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
  },
  mockPath: {
    join: vi.fn((...args: string[]) => args.join("/")),
    dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
    relative: vi.fn((from: string, to: string) => to),
    resolve: vi.fn((...args: string[]) => {
      // Simple resolve implementation for testing
      const path = args.join("/").replace(/\/+/g, "/");
      return path.startsWith("/") ? path : "/" + path;
    }),
  },
  mockFileURLToPath: vi.fn((url: string | URL) => {
    if (typeof url === "string") {
      return url.replace("file://", "");
    }
    if (url && typeof url === "object" && "href" in url) {
      return url.href.replace("file://", "");
    }
    return String(url).replace("file://", "");
  }),
}));

// Apply mocks
vi.mock("fs", () => ({
  promises: mockFs,
}));

vi.mock("path", () => ({
  default: mockPath,
}));

vi.mock("url", () => ({
  fileURLToPath: mockFileURLToPath,
}));

// Import after mocks are set up
import astroEmailObfuscation from "../../index.js";

describe("Core Functionality", () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    options: {},
    label: "test",
    fork: vi.fn(() => mockLogger),
  } as any;

  const mockBuildContext = {
    dir: new URL("file:///test/dist/"),
    logger: mockLogger,
    pages: [],
    routes: [],
    assets: new Map(),
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockFs.readFile.mockResolvedValue("// Mock decoder content");
    mockFs.readdir.mockResolvedValue([]);
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Email Detection and Processing", () => {
    it("should process emails with ROT18 method", async () => {
      const integration = astroEmailObfuscation({ method: "rot18", dev: true });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <p>Contact us at test@example.com for support</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "index.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      expect(processedContent).toContain("rot18-email");
      expect(processedContent).toContain("data-email");
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 emails processed"),
      );
    });

    it("should process emails with JavaScript concatenation method", async () => {
      const integration = astroEmailObfuscation({
        method: "js-concat",
        dev: true,
      });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <p>Email: admin@company.org</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "test.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      expect(processedContent).toContain("js-concat-email");
      expect(processedContent).toContain("data-p1");
      expect(processedContent).toContain("data-p2");
    });

    it("should handle SVG obfuscation method", async () => {
      const integration = astroEmailObfuscation({ method: "svg", dev: true });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <p>Contact: svg@test.com</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "svg.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      expect(processedContent).toContain("svg-email");
      expect(processedContent).toContain("<svg");
      expect(processedContent).toContain("<text");
    });
  });

  describe("Multiple Methods", () => {
    it("should use the last method in a methods array", async () => {
      const integration = astroEmailObfuscation({
        methods: ["rot18", "base64", "js-concat"],
        dev: true,
      });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <p>Email: multi@test.com</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "multi.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      describe("excludePathPattern", () => {
        it("should skip files matching excludePathPattern (string regex)", async () => {
          const integration = astroEmailObfuscation({
            method: "rot18",
            dev: true,
            excludePathPattern: "/posts/.*\\.html$",
          });
          const buildHook = integration.hooks["astro:build:done"];

          const htmlContent = `
            <html>
              <body>
                <p>Email: skipme@example.com</p>
              </body>
            </html>
          `;

          mockFs.readdir.mockResolvedValue([
            {
              name: "posts",
              isDirectory: () => true,
              isFile: () => false,
            } as any,
          ]);
          // Simulate /posts/slug.html inside /test/dist/posts
          mockFs.readdir.mockImplementation(async (dirPath: string) => {
            if (dirPath.endsWith("/posts")) {
              return [
                {
                  name: "slug.html",
                  isDirectory: () => false,
                  isFile: () => true,
                } as any,
              ];
            }
            return [];
          });

          mockFs.readFile.mockImplementation((filePath: any) => {
            if (filePath.includes("decoder.js")) {
              return Promise.resolve("// decoder script");
            }
            return Promise.resolve(htmlContent);
          });

          let processedContent = "";
          mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
            processedContent = content;
            return Promise.resolve();
          });

          await buildHook(mockBuildContext);

          // Should not process or write any obfuscated content
          expect(processedContent).toBe("");
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining("Skipping file due to excludePathPattern"),
          );
        });

        it("should skip files matching excludePathPattern (RegExp)", async () => {
          const integration = astroEmailObfuscation({
            method: "rot18",
            dev: true,
            excludePathPattern: /\/content\/articles\/.*\.html$/,
          });
          const buildHook = integration.hooks["astro:build:done"];

          const htmlContent = `
            <html>
              <body>
                <p>Email: skipme2@example.com</p>
              </body>
            </html>
          `;

          mockFs.readdir.mockResolvedValue([
            {
              name: "content",
              isDirectory: () => true,
              isFile: () => false,
            } as any,
          ]);
          // Simulate /content/articles/foo.html inside /test/dist/content/articles
          mockFs.readdir.mockImplementation(async (dirPath: string) => {
            if (dirPath.endsWith("/content")) {
              return [
                {
                  name: "articles",
                  isDirectory: () => true,
                  isFile: () => false,
                } as any,
              ];
            }
            if (dirPath.endsWith("/content/articles")) {
              return [
                {
                  name: "foo.html",
                  isDirectory: () => false,
                  isFile: () => true,
                } as any,
              ];
            }
            return [];
          });

          mockFs.readFile.mockImplementation((filePath: any) => {
            if (filePath.includes("decoder.js")) {
              return Promise.resolve("// decoder script");
            }
            return Promise.resolve(htmlContent);
          });

          let processedContent = "";
          mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
            processedContent = content;
            return Promise.resolve();
          });

          await buildHook(mockBuildContext);

          // Should not process or write any obfuscated content
          expect(processedContent).toBe("");
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining("Skipping file due to excludePathPattern"),
          );
        });
      });

      describe("excludeAddresses", () => {
        it("should not obfuscate addresses listed in excludeAddresses (text and link)", async () => {
          const integration = astroEmailObfuscation({
            method: "rot18",
            dev: true,
            excludeAddresses: ["visible@example.com", "link@example.com"],
          });
          const buildHook = integration.hooks["astro:build:done"];

          const htmlContent = `
            <html>
              <body>
                <p>Email: visible@example.com</p>
                <a href="mailto:link@example.com">link@example.com</a>
                <p>Email: obfuscate@example.com</p>
              </body>
            </html>
          `;

          mockFs.readdir.mockResolvedValue([
            {
              name: "exclude-addresses.html",
              isDirectory: () => false,
              isFile: () => true,
            } as any,
          ]);

          mockFs.readFile.mockImplementation((filePath: any) => {
            if (filePath.includes("decoder.js")) {
              return Promise.resolve("// decoder script");
            }
            return Promise.resolve(htmlContent);
          });

          let processedContent = "";
          mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
            processedContent = content;
            return Promise.resolve();
          });

          await buildHook(mockBuildContext);

          // visible@example.com and link@example.com should not be obfuscated
          expect(processedContent).toContain("visible@example.com");
          expect(processedContent).toContain("link@example.com");
          // obfuscate@example.com should be obfuscated
          expect(processedContent).toContain("rot18-email");
          // Only one email should be processed
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining("1 emails processed"),
          );
        });

        it("should obfuscate all emails if excludeAddresses is empty or not set", async () => {
          const integration = astroEmailObfuscation({
            method: "rot18",
            dev: true,
          });
          const buildHook = integration.hooks["astro:build:done"];

          const htmlContent = `
            <html>
              <body>
                <p>Email: visible@example.com</p>
                <a href="mailto:link@example.com">link@example.com</a>
              </body>
            </html>
          `;

          mockFs.readdir.mockResolvedValue([
            {
              name: "no-exclude-addresses.html",
              isDirectory: () => false,
              isFile: () => true,
            } as any,
          ]);

          mockFs.readFile.mockImplementation((filePath: any) => {
            if (filePath.includes("decoder.js")) {
              return Promise.resolve("// decoder script");
            }
            return Promise.resolve(htmlContent);
          });

          let processedContent = "";
          mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
            processedContent = content;
            return Promise.resolve();
          });

          await buildHook(mockBuildContext);

          // Both emails should be obfuscated
          expect(processedContent).toContain("rot18-email");
          // Should process both emails
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining("2 emails processed"),
          );
        });
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      // Should use js-concat (last method) for final output
      expect(processedContent).toContain("js-concat-email");
      expect(processedContent).toContain("data-p1");
      expect(processedContent).toContain("data-p2");
    });
  });

  describe("Target Configuration", () => {
    it("should process only mailto links when target is 'link'", async () => {
      const integration = astroEmailObfuscation({
        method: "rot18",
        target: "link",
        dev: true,
      });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <a href="mailto:contact@example.com">Email Us</a>
            <p>Text email: admin@example.com</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "links.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      // Should process mailto link but not text email
      expect(processedContent).toContain("rot18-email");
      expect(processedContent).not.toContain("mailto:");
      expect(processedContent).toContain("admin@example.com"); // Original text preserved
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 emails processed"),
      );
    });

    it("should process only text emails when target is 'text'", async () => {
      const integration = astroEmailObfuscation({
        method: "rot18",
        target: "text",
        dev: true,
      });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <a href="mailto:contact@example.com">Email Us</a>
            <p>Text email: admin@example.com</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "text.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      // Should process text email but not mailto link
      expect(processedContent).toContain("rot18-email");
      expect(processedContent).toContain("mailto:contact@example.com"); // Original mailto preserved
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 emails processed"),
      );
    });
  });

  describe("Development Mode", () => {
    it("should skip processing in development mode by default", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const integration = astroEmailObfuscation({ method: "rot18" });
      const buildHook = integration.hooks["astro:build:done"];

      await buildHook(mockBuildContext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email obfuscation: Skipping in development mode",
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should process in development mode when dev option is true", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const integration = astroEmailObfuscation({
        method: "rot18",
        dev: true,
      });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <p>Email: dev@example.com</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "dev.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      expect(processedContent).toContain("rot18-email");
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 emails processed"),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Error Handling", () => {
    it("should handle empty HTML content gracefully", async () => {
      const integration = astroEmailObfuscation({ method: "rot18", dev: true });
      const buildHook = integration.hooks["astro:build:done"];

      mockFs.readdir.mockResolvedValue([
        {
          name: "empty.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve("");
      });

      await buildHook(mockBuildContext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email obfuscation: No emails found to process",
      );
    });

    it("should handle malformed email addresses gracefully", async () => {
      const integration = astroEmailObfuscation({ method: "rot18", dev: true });
      const buildHook = integration.hooks["astro:build:done"];

      const htmlContent = `
        <html>
          <body>
            <p>Invalid emails: @example.com, test@, notanemail</p>
            <p>Valid: valid@example.com</p>
          </body>
        </html>
      `;

      mockFs.readdir.mockResolvedValue([
        {
          name: "malformed.html",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes("decoder.js")) {
          return Promise.resolve("// decoder script");
        }
        return Promise.resolve(htmlContent);
      });

      let processedContent = "";
      mockFs.writeFile.mockImplementation((filePath: any, content: any) => {
        processedContent = content;
        return Promise.resolve();
      });

      await buildHook(mockBuildContext);

      // Should only process the valid email
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 emails processed"),
      );
      // Should contain the obfuscated version, not the original
      expect(processedContent).toContain("rot18-email");
      expect(processedContent).toContain("data-email");
      // The original email should be ROT18 encoded
      expect(processedContent).toContain("inyvq@rknzcyr.pbz"); // ROT18 of valid@example.com
    });
  });
});
