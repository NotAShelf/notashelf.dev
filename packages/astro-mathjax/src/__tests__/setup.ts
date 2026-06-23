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

export function createMockSetupContext(processor?: object) {
  return {
    command: "build" as const,
    isRestart: false,
    logger: mockLogger,
    config: {
      integrations: [],
      markdown: {
        ...(processor ? { processor } : {}),
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
