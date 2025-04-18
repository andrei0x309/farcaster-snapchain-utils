// CLI Degit
import { stdin, stdout } from 'process';
const args = process.argv.slice(2);
const isRequestHelp = args.includes("--help") || args.includes("-h") || args.includes("help");
if (isRequestHelp) {
  console.info(`Usage: bun run degit`);
}

// prompt are you sure?
const isSure = await new Promise<boolean>((resolve) => {
  stdout.write("Are you sure you want to degit? (y/n): ");
  stdin.on("data", (data) => {
    const input = data.toString().trim().toLowerCase();
    if ( input === "y" || input === "yes")
        resolve(true);
    else if ( input === "n" || input === "no")
        resolve(false);
    else
    stdout.write("Invalid input. Please enter 'y' or 'n': ");
  });
  });


  if (!isSure) {
    console.info("Aborting degit.");
    process.exit(0);
  }
  // check if .git directory exists
  const gitFolderPath = ".git";

  // check if .git directory exists
  if (!!!Array.from(new Bun.Glob(gitFolderPath).scanSync({ onlyFiles: false }))) {
    console.info("No .git directory found. Are you sure you ran this command in the root of your project?");
    process.exit(0);
  } else {
    await Bun.$`rm -rf .git`;
    await Bun.$`git init`;
    console.info("Initialized git repository.");
    process.exit(0);
  }
