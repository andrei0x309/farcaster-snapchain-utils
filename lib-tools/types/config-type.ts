/**
 * Configuration type
 */
export interface ConfigType {
    /**
     * The target environment for the output code.
     * @default "node"
     *  possible values: "node" | "browser" | "bun"
    */
    target: "node" | "browser" | "bun";
    /**
    * Emit type declarations for typescript support.
    * @default true
    */
    emitTypes: boolean;
    /**
     * The entry points of the project.
     * @default ['./src/index.ts']
     * */
    entrypoints: string[];
    /**
     * The root directory of the project.
     * @default './src'
     */
    root: string;
    /**
     * The output directory for the generated files.
     * @default './dist'
     * */
    outdir: string;
    /**
    * Whether to minify the output code.
    * @default true
    * */
    minify: boolean;
    /**
     * Whether to split the output code into multiple files.
     * @default true
     * */
    splitting: boolean;
    /**
     * Type of license to generate using the license generator.
     * @default "MIT"
     * */
    license: "MIT" | "AGPLv3" | "BSLv1" | "GPLv3" | "LGPLv3" | "Mozilla" | "PublicDomain"
    /**
     * Whether to create an additional export per entrypoint.
     * e.g. if you have an entrypoint called "./src/example/example.ts", an export will be created "/example/example"
     * runs only if autoFillExportsInPackageJson is true
     * @default false
     * */
    createAdditionalExportPerEntrypoint: boolean;
    /**
     * Whether to auto fill the exports in the package.json file.
     * @default true
     * */
    autoFillExportsInPackageJson: boolean;
}