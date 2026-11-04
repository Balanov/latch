import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const dist = new URL("./dist/", root);
await rm(dist, { recursive: true, force: true });
await mkdir(new URL("./src/", dist), { recursive: true });
await cp(new URL("./src/", root), new URL("./src/", dist), { recursive: true });
await cp(new URL("./index.html", root), new URL("./index.html", dist));
await cp(new URL("../providers/php/", root), new URL("./api/", dist), { recursive: true });
console.log("Static client and independent PHP provider ready: app/dist/");
