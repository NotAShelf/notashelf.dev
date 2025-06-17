import type { AstroIntegration } from "astro";

type OptionalExceptFor<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : T[P] | undefined;
} & Pick<T, K>;

interface PlausibleOptions {
  /**
   * The domain name(s) of your website(s). Can be a single domain or a comma-separated list for multiple domains.
   *
   * @example "example.com"
   * @example "example.com,app.example.com"
   */
  domain: string;
  /**
   * The URL where your Plausible Analytics script is hosted.
   *
   * @default "https://plausible.io/js/script.js"
   * @example "https://analytics.example.com/js/script.js"
   */
  src?: string;
  /**
   * The API endpoint for your Plausible Analytics instance.
   *
   * @default "https://plausible.io/api/event"
   * @example "https://analytics.example.com/api/event"
   */
  apiHost?: string;
  /**
   * Enable automatic tracking of outbound link clicks.
   */
  trackOutboundLinks?: boolean;
  /**
   * Enable automatic tracking of file downloads.
   */
  trackFileDownloads?: boolean;
  /**
   * Enable tracking of 404 error pages.
   */
  track404?: boolean;
  /**
   * Enable tracking of pages with hash-based routing.
   */
  trackHashBasedRouting?: boolean;
  /**
   * Enable custom event tracking capabilities.
   */
  enableCustomEvents?: boolean;
  /**
   * Enable custom properties (dimensions) tracking.
   */
  enableCustomProperties?: boolean;
  /**
   * Enable ecommerce revenue tracking.
   */
  enableEcommerce?: boolean;
  /**
   * Custom file types to track for download events. Comma-separated list.
   *
   * @example "pdf,doc,zip"
   */
  customFileTypes?: string;
  /**
   * Additional file types to track alongside the default list. Comma-separated list.
   *
   * @example "js,py"
   */
  additionalFileTypes?: string;
  /**
   * If you want the tracker to only run on specific domains, add them to this list.
   *
   * @example ["mywebsite.com", "mywebsite2.com"]
   */
  allowedDomains?: string[];
  /**
   * Exclude specific paths from tracking. Supports wildcards.
   *
   * @example ["/admin/*", "/dashboard/*"]
   */
  excludePaths?: string[];
  /**
   * Set this if you don't want to collect the hash value from the URL.
   */
  excludeHash?: boolean;
  /**
   * Set this if you don't want to collect search parameters from the URL.
   */
  excludeSearch?: boolean;
  /**
   * Enable manual mode for custom pageview triggering.
   */
  manualMode?: boolean;
}

interface Options extends PlausibleOptions {
  /**
   * Serve the tracking script using [Partytown](https://partytown.qwik.dev/).
   *
   * @see [https://docs.astro.build/en/guides/integrations-guide/partytown/](https://docs.astro.build/en/guides/integrations-guide/partytown/)
   */
  withPartytown?: boolean;
}

async function getInjectableWebAnalyticsContent({
  mode,
  options,
}: {
  mode: "development" | "production";
  options: OptionalExceptFor<Options, "domain">;
}): Promise<string> {
  const {
    domain,
    src = "https://plausible.io/js/script.js",
    apiHost = "https://plausible.io/api/event",
    trackOutboundLinks = false,
    trackFileDownloads = false,
    track404 = false,
    trackHashBasedRouting = false,
    enableCustomEvents = false,
    enableCustomProperties = false,
    enableEcommerce = false,
    customFileTypes,
    additionalFileTypes,
    allowedDomains = [],
    excludePaths = [],
    excludeHash = false,
    excludeSearch = false,
    manualMode = false,
    withPartytown = false,
  } = options;

  // Build the script source URL based on enabled features
  let scriptSrc = src;
  const extensions: string[] = [];

  if (trackOutboundLinks) extensions.push("outbound-links");
  if (trackFileDownloads) extensions.push("file-downloads");
  if (track404) extensions.push("404");
  if (trackHashBasedRouting) extensions.push("hash");
  if (enableCustomEvents) extensions.push("tagged-events");
  if (enableCustomProperties) extensions.push("custom-props");
  if (enableEcommerce) extensions.push("revenue");
  if (manualMode) extensions.push("manual");

  if (extensions.length > 0) {
    const baseUrl = src.replace("/script.js", "");
    scriptSrc = `${baseUrl}/script.${extensions.join(".")}.js`;
  }

  const configAsString = [
    apiHost !== "https://plausible.io/api/event"
      ? `script.setAttribute("data-api", "${apiHost}")`
      : "",
    allowedDomains.length > 0
      ? `script.setAttribute("data-included-domains", "${allowedDomains.join(",")}")`
      : "",
    excludePaths.length > 0
      ? `script.setAttribute("data-exclude", "${excludePaths.join(",")}")`
      : "",
    excludeHash ? `script.setAttribute("data-exclude-hash", "true")` : "",
    excludeSearch ? `script.setAttribute("data-exclude-search", "true")` : "",
    customFileTypes
      ? `script.setAttribute("file-types", "${customFileTypes}")`
      : "",
    additionalFileTypes
      ? `script.setAttribute("add-file-types", "${additionalFileTypes}")`
      : "",
    withPartytown ? `script.setAttribute("type", "text/partytown")` : "",
  ]
    .filter(Boolean)
    .join(";\n");

  const commonScript = `
    var script = document.createElement("script");
    var viewTransitionsEnabled = document.querySelector("meta[name='astro-view-transitions-enabled']")?.content;

    script.setAttribute("src", "${scriptSrc}");
    script.setAttribute("defer", true);
    script.setAttribute("data-domain", "${domain}");
    ${configAsString};

    if (!!viewTransitionsEnabled) {
      script.setAttribute("data-astro-rerun", true);
    }

    var head = document.querySelector("head");
    head.appendChild(script);
  `;

  if (mode === "development") {
    return `
        console.log('[astro-plausible] Development mode - Plausible script not loaded');

        // Provide mock plausible function for development
        window.plausible = window.plausible || function() {
          console.log('[Plausible] Development mode - tracking disabled:', arguments);
        };
    `;
  }

  return `
        console.log('[astro-plausible] Production mode - loading Plausible script');
        ${commonScript}
  `;
}

export default function plausibleIntegration(
  options: OptionalExceptFor<Options, "domain">,
): AstroIntegration {
  // Validate required domain parameter
  if (
    !options?.domain ||
    typeof options.domain !== "string" ||
    options.domain.trim() === ""
  ) {
    throw new Error(
      "astro-plausible: domain option is required and must be a non-empty string",
    );
  }

  return {
    name: "astro-plausible",
    hooks: {
      "astro:config:setup": async ({ command, injectScript, logger }) => {
        const isDev = command === "dev";

        const script = await getInjectableWebAnalyticsContent({
          mode: isDev ? "development" : "production",
          options,
        });

        // Try page injection instead of head-inline
        injectScript("page", script);

        logger.info(`Plausible Analytics configured for domain: ${options.domain}`);
      },
    },
  };
}
