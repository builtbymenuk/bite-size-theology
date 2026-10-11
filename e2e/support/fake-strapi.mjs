// A stand-in Strapi for the e2e server, so the suite never touches the real CMS on :1337.
//
// Why it exists at all: with STRAPI_URL blank the site serves content.ts, whose `store.comingSoon`
// is true — the shop is closed, product and checkout pages redirect to /store, and there's nothing
// to put in a cart. This server answers exactly one thing, the Store single type with
// `comingSoon: false`, and 404s everything else. cms.ts treats a 404 as "use the fallback", so every
// other page still renders content.ts and the shop runs on the static catalog.
//
// It only ever listens on loopback and holds no data; writes (orders, contact messages) can't land
// here anyway because STRAPI_API_TOKEN is blank, which every write path checks first.
import http from "node:http";

const port = Number(process.env.FAKE_STRAPI_PORT || 3199);

const server = http.createServer((req, res) => {
  const path = (req.url || "/").split("?")[0];
  if (req.method === "GET" && path === "/api/store") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: { comingSoon: false } }));
    return;
  }
  // Playwright's webServer readiness probe.
  if (path === "/_health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ data: null, error: { status: 404, name: "NotFoundError" } }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`fake strapi on http://127.0.0.1:${port}`);
});
