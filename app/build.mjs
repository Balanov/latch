import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const dist = new URL("./dist/", root);
await rm(dist, { recursive: true, force: true });
await mkdir(new URL("./src/", dist), { recursive: true });
await cp(new URL("./src/", root), new URL("./src/", dist), { recursive: true });
await cp(new URL("./index.html", root), new URL("./index.html", dist));
console.log("Static site ready: app/dist/");
