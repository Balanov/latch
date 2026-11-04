const target = process.argv[2];
if (target === "latch") {
  await import("../../latch.mjs");
} else if (target === "mcp") {
  await Promise.all([
    import("@modelcontextprotocol/sdk/server/mcp.js"),
    import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
    import("@modelcontextprotocol/sdk/client/index.js"),
    import("@modelcontextprotocol/sdk/client/streamableHttp.js")
  ]);
} else if (target !== "raw") {
  throw new Error("Usage: node cold.mjs raw|latch|mcp");
}
console.log(target);
