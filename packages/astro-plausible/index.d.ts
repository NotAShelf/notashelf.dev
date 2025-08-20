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
export default function plausibleIntegration(
  options: OptionalExceptFor<Options, "domain">,
): AstroIntegration;
export {};
