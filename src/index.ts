import { Hono } from "hono";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { api, likeCount } from "./api.ts";
import { assets, type Env } from "./assets.ts";
import { findPost } from "./posts.ts";
import { about, home, notFound, postPage } from "./pages.ts";

const app = new Hono<{ Bindings: Env }>();

app.use(logger());
app.use(secureHeaders());
app.use(etag());

app.get("/", (c) => c.html(home()));
app.get("/about", (c) => c.html(about()));

app.get("/posts/:slug", (c) => {
  const post = findPost(c.req.param("slug"));
  if (!post) return c.html(notFound(), 404);
  return c.html(postPage(post, likeCount(post.slug)));
});

app.route("/api", api);
app.get("/assets/*", assets);

app.notFound((c) => c.html(notFound(), 404));

export default app;
