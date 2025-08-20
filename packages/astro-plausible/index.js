async function getInjectableWebAnalyticsContent({ mode, options }) {
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
  const extensions = [];
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
export default function plausibleIntegration(options) {
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
        logger.info(
          `Plausible Analytics configured for domain: ${options.domain}`,
        );
      },
    },
  };
}
