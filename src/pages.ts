import { html } from "../vendor/hono-html.js";
import { layout } from "./layout.ts";
import { posts, type Post } from "./posts.ts";

export const home = () =>
  layout({
    title: "Posts",
    body: html`<h1>Posts</h1>
      <ul class="posts">
        ${posts.map(
          (p) => html`<li><a href="/posts/${p.slug}">${p.title}</a> <time>${p.date}</time></li>`,
        )}
      </ul>`,
  });

export const postPage = (post: Post, likes: number) =>
  layout({
    title: post.title,
    body: html`<article>
      <h1>${post.title}</h1>
      <time>${post.date}</time>
      <p>${post.body}</p>
      <like-button slug="${post.slug}">
        <button type="button" disabled>Like (${likes})</button>
      </like-button>
    </article>`,
  });

export const about = () =>
  layout({
    title: "About",
    body: html`<h1>About</h1>
      <p>A server-rendered site with no build step: TypeScript that workerd strips at load,
      Hono's <code>html</code> template tag, and one browser module for the interactive part.</p>`,
  });

export const notFound = () =>
  layout({ title: "Not found", body: html`<h1>Not found</h1><p><a href="/">Back to posts</a></p>` });
