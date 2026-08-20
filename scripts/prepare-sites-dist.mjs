import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const openNextDir = join(root, ".open-next");
const distDir = join(root, "dist");

if (!existsSync(join(openNextDir, "worker.js"))) {
  throw new Error("OpenNext worker was not generated at .open-next/worker.js");
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
cpSync(openNextDir, distDir, { recursive: true });

const workerTarget = join(distDir, "server", "index.js");
mkdirSync(dirname(workerTarget), { recursive: true });
writeFileSync(workerTarget, 'export { default } from "../worker.js";\nexport * from "../worker.js";\n');

const hostingPath = join(root, ".openai", "hosting.json");
if (existsSync(hostingPath)) {
  const target = join(distDir, ".openai", "hosting.json");
  mkdirSync(dirname(target), { recursive: true });
  cpSync(hostingPath, target);
}
