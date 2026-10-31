import * as vite0 from "vite";
import { InlineConfig, PluginOption } from "vite";
import * as parser from "@slidev/parser/fs";
import { ResolvedSlidevOptions, ResolvedSlidevUtils, SlidevEntryOptions, SlidevPluginOptions, SlidevServerOptions } from "@slidev/types";

//#region node/commands/serve.d.ts
declare function createServer(options: ResolvedSlidevOptions, viteConfig?: InlineConfig, serverOptions?: SlidevServerOptions): Promise<vite0.ViteDevServer>;
//#endregion
//#region node/options.d.ts
declare function resolveOptions(entryOptions: SlidevEntryOptions, mode: ResolvedSlidevOptions['mode']): Promise<ResolvedSlidevOptions>;
declare function createDataUtils(resolved: Omit<ResolvedSlidevOptions, 'utils'>): Promise<ResolvedSlidevUtils>;
//#endregion
//#region node/vite/index.d.ts
/**
 * Main Slidev Vite plugin
 *
 * @param options - Resolved Slidev options including framework choice
 * @param pluginOptions - Plugin-specific options (Vue, markdown, etc.)
 * @param serverOptions - Server options for HMR
 */
declare function ViteSlidevPlugin(options: ResolvedSlidevOptions, pluginOptions?: SlidevPluginOptions, serverOptions?: SlidevServerOptions): Promise<PluginOption[]>;
//#endregion
export { ViteSlidevPlugin, createDataUtils, createServer, parser, resolveOptions };