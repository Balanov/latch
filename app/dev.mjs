import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
function option(name, fallback) {
  const exact = args.indexOf(`--${name}`);
  const joined = args.find((arg) => arg.startsWith(`--${name}=`));
  return joined ? joined.slice(name.length + 3) : (exact === -1 ? fallback : args[exact + 1]);
}
const host = option("host", "127.0.0.1");
const port = Number(option("port", "7100"));
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid --port");
const root = fileURLToPath(new URL("./", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };

const server = http.createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const target = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const info = await stat(target);
    if (!info.isFile()) throw new Error("Not a file");
    const content = await readFile(target);
    response.writeHead(200, {
      "content-type": types[path.extname(target)] || "application/octet-stream",
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff"
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});
server.listen(port, host, () => {
  const address = server.address();
  console.log(`LATCH preview: http://${host}:${address.port}/`);
});
