import { t as resolveViteConfigs } from "./shared-B01QX6Js.mjs";
import { join } from "node:path";
import process from "node:process";
import { createServer } from "vite";

//#region node/commands/serve.ts
async function createServer$1(options, viteConfig = {}, serverOptions) {
	process.env.EDITOR = process.env.EDITOR || "code";
	const reactClientRoot = options.reactClientRoot || options.clientRoot.replace(/\/client$/, "/client-react");
	return await createServer(await resolveViteConfigs(options, { optimizeDeps: { entries: [options.framework === "react" ? join(reactClientRoot, "main.tsx") : join(options.clientRoot, "main.ts")] } }, viteConfig, "serve", serverOptions));
}

//#endregion
export { createServer$1 as t };