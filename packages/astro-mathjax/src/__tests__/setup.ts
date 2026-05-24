import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

export function createMockSetupContext() {
  return {
    command: "build" as const,
    isRestart: false,
    logger: mockLogger,
    config: {
      integrations: [],
      markdown: {
        remarkPlugins: [],
        rehypePlugins: [],
      },
    },
    updateConfig: vi.fn(),
    addRenderer: vi.fn(),
    addWatchFile: vi.fn(),
    addClientDirective: vi.fn(),
    addMiddleware: vi.fn(),
    injectScript: vi.fn(),
    injectRoute: vi.fn(),
  } as any;
}
