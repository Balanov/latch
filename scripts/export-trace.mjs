import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const trace = JSON.parse(await readFile(new URL("./examples/trace.json", root), "utf8"));
const target = new URL("./app/src/trace.js", root);
await writeFile(target, `// Generated from a real local reference-server exchange.\nexport const trace = ${JSON.stringify(trace, null, 2)};\n`);
console.log("Exported the recorded exchange to app/src/trace.js");
