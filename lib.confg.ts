import type { ConfigType } from "./lib-tools/types/config-type";

export const libConfig: ConfigType = {
	target: 'node',
    emitTypes: true,
    entrypoints: ['./src/index.ts', './src/second-entry-point.ts'],
    root: './src',
    outdir: './dist',
    minify: true,
    splitting: true,
    license: 'MIT',
    autoFillExportsInPackageJson: true,
    createAdditionalExportPerEntrypoint: true,
};