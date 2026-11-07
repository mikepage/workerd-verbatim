import { Hono } from "../vendor/hono.js";
import { findPost } from "./posts.ts";
import { about, home, notFound, postPage } from "./pages.ts";

// The disk service binding. Written out because @cloudflare/workers-types comes from npm.
type Env = { PUBLIC: { fetch(request: Request): Promise<Response> } };

const app = new Hono<{ Bindings: Env }>();

// In memory: lives as long as the isolate. Resets on restart and on every --watch reload.
const likes = new Map<string, number>();

app.get("/", (c) => c.html(home()));
app.get("/about", (c) => c.html(about()));

app.get("/posts/:slug", (c) => {
  const post = findPost(c.req.param("slug"));
  if (!post) return c.html(notFound(), 404);
  return c.html(postPage(post, likes.get(post.slug) ?? 0));
});

app.post("/api/likes/:slug", (c) => {
  const slug = c.req.param("slug");
  if (!findPost(slug)) return c.json({ error: "not found" }, 404);
  const count = (likes.get(slug) ?? 0) + 1;
  likes.set(slug, count);
  return c.json({ count });
});

// workerd's disk service sends every file as application/octet-stream.
// Browsers refuse module scripts and stylesheets with that type, so set it here.
const types: Record<string, string> = {
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
};

// Static files come from workerd's disk service, bound as PUBLIC.
app.get("/assets/*", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.slice("/assets".length);
  const res = await c.env.PUBLIC.fetch(new Request(url));
  const type = types[url.pathname.split(".").pop() ?? ""];
  if (!res.ok || !type) return res;
  const headers = new Headers(res.headers);
  headers.set("content-type", type);
  return new Response(res.body, { status: res.status, headers });
});

app.notFound((c) => c.html(notFound(), 404));

export default app;
