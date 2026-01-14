import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const defaultBackupPath = path.resolve(projectRoot, "../yoojasalon backup");
const backupRoot = process.argv[2] ? path.resolve(process.argv[2]) : defaultBackupPath;

async function run() {
  console.log(`Using backup folder: ${backupRoot}`);
  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const postDirs = entries.filter((entry) => entry.isDirectory());

  if (postDirs.length === 0) {
    console.warn("No post directories found. Check the backup path.");
    return;
  }

  console.log(`Found ${postDirs.length} post folders.`);
  console.log("TODO: parse HTML, convert to Markdown, and copy assets.");
  console.log("Dependencies to add later: jsdom, turndown (or similar).");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
