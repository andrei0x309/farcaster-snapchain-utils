// CLI License Generator
import type { ConfigType } from "../types/config-type"
import { libConfig } from "../../lib.confg"
// get arguments
const args = process.argv.slice(2);
let license = args[0];
const isRequestHelp = args.includes("--help") || args.includes("-h") || args.includes("help");
const validLicenses: ConfigType["license"][] = ["MIT", "AGPLv3", "BSLv1", "GPLv3", "LGPLv3", "Mozilla", "PublicDomain"]
if (isRequestHelp) {
    console.info(`Usage: bun run generate-license [license]`);
    console.info(`Available licenses: ${validLicenses.join(", ")}`);
    process.exit(0);
  }
  
  if(!license) {
    license = libConfig.license
  }
// check if license is valid
if (!validLicenses.includes(license as ConfigType["license"])) {
  console.error(`Unknown license: ${license}, valid licenses are: ${validLicenses.join(", ")}`);
  process.exit(1);
}
// copy file in root directory from ../LICENSE_TEMPLATE to ../../LICENSE
const biteContents = await Bun.file(`${__dirname}/../LICENSE_TEMPLATES/${license}.txt`).bytes()
Bun.file(`${__dirname}/../../LICENSE`).write(biteContents.buffer)
console.info(`Generated license file: LICENSE of type ${license}`);
