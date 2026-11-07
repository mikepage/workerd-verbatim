import { html } from "hono/html";

export const layout = ({ title, body }: { title: string; body: unknown }) => html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} · verbatim</title>
    <link rel="stylesheet" href="/assets/style.css">
    <script type="module" src="/assets/islands/like-button.js"></script>
  </head>
  <body>
    <header>
      <a href="/">verbatim</a>
      <nav><a href="/">Posts</a> <a href="/about">About</a></nav>
    </header>
    <main>${body}</main>
    <footer>Served by workerd from unbuilt source.</footer>
  </body>
</html>`;
