import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [];
const ignored = new Set([".git", ".next", ".venv", "node_modules", "artifacts"]);
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (ignored.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|mjs|json|md|py|ya?ml|example)$/.test(name)) files.push(full);
  }
}
walk(root);
const text = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
if (!text.includes("61999") || !text.includes("https://studio.genlayer.com/api")) throw new Error("Studionet configuration missing");
const forbiddenChain = "619" + "97";
const forbiddenName = "studio" + "-dev";
if (text.includes(forbiddenChain) || text.toLowerCase().includes(forbiddenName)) throw new Error("Forbidden network contamination found");
console.log("network configuration is consistently pinned to Studionet 61999");
