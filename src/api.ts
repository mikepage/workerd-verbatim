import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { findPost } from "./posts.ts";

// In memory: lives as long as the isolate. Resets on restart and on every --watch reload.
const likes = new Map<string, number>();

export const likeCount = (slug: string) => likes.get(slug) ?? 0;

export const api = new Hono().post(
  "/likes/:slug",
  validator("param", (value) => {
    const post = findPost(value.slug ?? "");
    if (!post) throw new HTTPException(404, { message: "No such post" });
    return { slug: post.slug };
  }),
  (c) => {
    const { slug } = c.req.valid("param");
    const count = likeCount(slug) + 1;
    likes.set(slug, count);
    return c.json({ count });
  },
);
