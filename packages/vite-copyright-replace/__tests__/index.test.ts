import { afterEach, describe, expect, it, vi } from "vitest";
import { copyrightYearPlugin } from "../index";

afterEach(() => vi.useRealTimers());

async function transform(
  source: string,
  id: string,
  options?: Parameters<typeof copyrightYearPlugin>[0],
) {
  const hook = copyrightYearPlugin(options).transform;
  if (typeof hook !== "function") {
    throw new Error("Expected a transform hook");
  }
  return hook.call({ info() {} } as never, source, id);
}

describe("copyright year replacement", () => {
  it("replaces every literal custom placeholder with a single year when the starting year is current", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(
      await transform("© (YEAR).$ and (YEAR).$", "/site/src/footer.astro", {
        placeholder: "(YEAR).$",
        startYear: 2026,
      }),
    ).toEqual({ code: "© 2026 and 2026", map: null });
  });

  it("replaces the default placeholder with a year range in queried Astro module IDs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(
      await transform(
        "<footer>__COPYRIGHT_YEAR__</footer>",
        "/site/src/Footer.astro?astro&type=template",
      ),
    ).toEqual({ code: "<footer>2024-2026</footer>", map: null });
  });

  it("does not mistake application directories for dependencies", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(
      await transform(
        "__COPYRIGHT_YEAR__",
        "/site/node_modules_examples/footer.ts",
      ),
    ).toEqual({ code: "2024-2026", map: null });
  });

  it("leaves irrelevant modules untouched even if their query contains an eligible extension", async () => {
    expect(
      await transform(
        "__COPYRIGHT_YEAR__",
        "/site/src/theme.css?src=footer.ts",
      ),
    ).toBeNull();
    expect(
      await transform("__COPYRIGHT_YEAR__", "/site/node_modules/lib/footer.ts"),
    ).toBeNull();
  });
});
