import type { UserDefinedOptions } from "purgecss";
import type { ProcessOptions, Plugin, PluginCreator } from "postcss";

export interface CSSNanoOptions {
  preset?: [string, Record<string, any>] | string;
  plugins?: any[];
  [key: string]: any;
}

export type AnyPostCSSPlugin =
  | Plugin
  | PluginCreator<any>
  | { postcssPlugin: string }
  | [Plugin | PluginCreator<any>, any]
  | string
  | [string, any];

export interface PostCSSConfig {
  plugins?: AnyPostCSSPlugin[];
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
