import type { UserDefinedOptions } from "purgecss";
import type { ProcessOptions, Plugin, PluginCreator } from "postcss";

export interface CSSNanoOptions {
  preset?: [string, Record<string, any>] | string;
  plugins?: any[];
  [key: string]: any;
}

export interface PostCSSConfig {
  plugins?: (
    | Plugin
    | PluginCreator<any>
    | [Plugin | PluginCreator<any>, any]
    | string
    | [string, any]
  )[];
  options?: ProcessOptions;
}

export interface PurgeCSSIntegrationOptions {
  purgeCSS?: Partial<UserDefinedOptions>;
  cssnano?: boolean | CSSNanoOptions;
  postcss?: PostCSSConfig;
  safelist?: string[];
  blocklist?: string[];
  keyframes?: boolean;
  fontFace?: boolean;
}

declare function purgeCSSIntegration(
  options?: PurgeCSSIntegrationOptions,
): import("astro").AstroIntegration;

export default purgeCSSIntegration;
export { purgeCSSIntegration };
