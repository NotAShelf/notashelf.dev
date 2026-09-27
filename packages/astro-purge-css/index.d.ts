import type { AstroIntegration } from "astro";
import type { Options as CSSNanoOptions } from "cssnano";
import type { AcceptedPlugin, ProcessOptions } from "postcss";
import type { UserDefinedOptions } from "purgecss";
interface PostCSSConfig {
    plugins?: AcceptedPlugin[];
    options?: ProcessOptions;
}
interface PurgeCSSIntegrationOptions {
    purgeCSS?: Partial<UserDefinedOptions>;
    cssnano?: boolean | CSSNanoOptions;
    postcss?: PostCSSConfig;
    safelist?: string[];
    blocklist?: string[];
    keyframes?: boolean;
    fontFace?: boolean;
}
declare function purgeCSSIntegration(options?: PurgeCSSIntegrationOptions): AstroIntegration;
export default purgeCSSIntegration;
export { purgeCSSIntegration };
export type { PurgeCSSIntegrationOptions, CSSNanoOptions, PostCSSConfig };
