import { createMiddleware } from "hono/factory";

// The disk service binding. Written out because @cloudflare/workers-types comes from npm.
export type Env = { PUBLIC: { fetch(request: Request): Promise<Response> } };

// workerd's disk service sends every file as application/octet-stream.
// Browsers refuse module scripts and stylesheets with that type, so set it here.
const types: Record<string, string> = {
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
};

// Serves /assets/* from workerd's disk service, bound as PUBLIC.
export const assets = createMiddleware<{ Bindings: Env }>(async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.slice("/assets".length);
  const res = await c.env.PUBLIC.fetch(new Request(url));
  // Always copy: a fetched Response has immutable headers, and middleware like
  // secureHeaders throws "Can't modify immutable headers" on it, even on a 404.
  const headers = new Headers(res.headers);
  const type = types[url.pathname.split(".").pop() ?? ""];
  if (res.ok && type) headers.set("content-type", type);
  return new Response(res.body, { status: res.status, headers });
});
