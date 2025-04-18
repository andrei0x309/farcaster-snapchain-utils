import { libConfig } from '../../lib.confg.ts'
import type { BunPlugin } from 'bun'

if(libConfig.autoFillExportsInPackageJson) {
 const { autoFillExports } = (await import('./exports-check.ts'))
 autoFillExports()
}

const plugins = [] as BunPlugin[]
if (libConfig.emitTypes) {
	const lib = (await import('../build-plugin/plugin.ts'))
	plugins.push(lib.getDtsBunPlugin())
}

await Bun.$`rm -rf dist`;
const result = await Bun.build({
	entrypoints: libConfig.entrypoints,
	root: libConfig.root,
    target: libConfig.target,
	outdir: libConfig.outdir,
	minify: libConfig.minify,
	splitting: libConfig.splitting,
	plugins,
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}
console.info(`Build successful!`);
