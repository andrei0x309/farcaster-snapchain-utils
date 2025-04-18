import { libConfig } from '../../lib.confg'
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export const autoFillExports = () => {

  const { emitTypes, entrypoints, outdir, root,  createAdditionalExportPerEntrypoint } = libConfig;
  const packageJsonPath = resolve('./package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageJson.module = entrypoints[0].replace(/\.ts$/, '.js').replace(`${root}/`, `${outdir}/`);
  packageJson.main = entrypoints[0].replace(/\.ts$/, '.js').replace(`${root}/`, `${outdir}/`);
  if (emitTypes) {
    packageJson.types = entrypoints[0].replace(/\.ts$/, '.d.ts').replace(`${root}/`, `${outdir}/`);
  } else {
    delete packageJson.types;
  }
  packageJson.files = [ libConfig.outdir.replace('./', '') ];
  packageJson.exports = {
    '.': {
      'import': entrypoints[0].replace(/\.ts$/, '.js').replace(`${root}/`, `${outdir}/`),
    },
  };
  if (emitTypes) {
    packageJson.exports['.']["types"] = entrypoints[0].replace(/\.ts$/, '.d.ts').replace(`${root}/`, `${outdir}/`);
  }
  const restEntryPoints = entrypoints.slice(1) || [];
if (createAdditionalExportPerEntrypoint) {
       for(const entrypoint of restEntryPoints) {
        const exportPath = `./${entrypoint.split(`${root}/`)[1].replace(/\.ts$/, '')}`
        packageJson.exports[exportPath] = {
          'import': entrypoint.replace(/\.ts$/, '.js').replace(`${root}/`, `${outdir}/`),
        };
        if (emitTypes) {
            packageJson.exports[exportPath]["types"] = entrypoint.replace(/\.ts$/, '.d.ts').replace(`${root}/`, `${outdir}/`)
        }
      }
}
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

}