# workerd-verbatim

A server-rendered TypeScript Hono site with no build step, served by workerd on Debian. The files
in `src/` and `public/` are the files that run. No Node, npm, Bun or Deno: not to serve, not to
type check.

The official `npm create hono` cloudflare-workers starter runs here unchanged:
[`starter/index.ts`](starter/index.ts) is a byte-for-byte copy, served on port 8081.

## Conclusion

It works. workerd strips TypeScript types at load, and TypeScript 7's native `tsc` checks them.
Both are single binaries fetched with curl. Bare `import { Hono } from "hono"` works because
workerd module names can be anything, so `vendor.sh` puts Hono under its npm names.

| | |
|---|---|
| Runtime | workerd `v1.20261107.1`, `debian:13-slim`, nothing else installed |
| TypeScript | workerd's `typescript_strip_types` flag (experimental) runs `.ts` files as written |
| Type check | TypeScript `7.0.2` native `tsc` binary: 0.6 s for the whole project, container start included |
| Framework | Hono `5.0.0-rc.1`: 15 entries (`hono`, `hono/html`, `hono/logger`, `hono/cors`, …), 69 KB of JS |
| Middleware used | `logger`, `secureHeaders`, `etag`, `validator`, `HTTPException`, `createMiddleware`, `app.route` |
| Edit → visible | ~1 s with `workerd serve --watch` |
| Memory | 19 MB resident |
| Image | 349 MB: 142 MB Debian + 155 MB workerd binary |

What you give up in exchange for no build step:

- **Erasable TypeScript only.** No `enum`, `namespace` or parameter properties. workerd fails the module
  at load ("TypeScript enum is not supported in strip-only mode"); `erasableSyntaxOnly` in
  `tsconfig.json` makes tsc report it first.
- **The flag is experimental.** workerd refuses to start without `--experimental`: "may break or be
  removed in a future version of workerd".
- **Stripping is not checking.** `const x: number = "a"` runs fine. Run `tsc` before you deploy.
- **No JSX.** Templates use Hono's `html` tag. It escapes interpolated values the same way.
- **Every module is listed by hand in `config.capnp`.** workerd doesn't read undeclared files.
  Forget one and the request fails with a 500: `No such module "extra.ts"`.
- **Source modules get flat names.** See below.
- **Dependencies are a `vendor/` folder.** Only packages that bundle into self-contained ESM work.
  jsDelivr's `/+esm` gives that for each Hono entry; the types come from the npm tarball.
- **No `@cloudflare/workers-types`.** Binding types are written out by hand (`Env` in `src/assets.ts`).
- **No minification or cache-busting hashes** on browser assets.

## Surprises

- **Bare imports resolve against the importing module's folder.** `import "hono"` from a module named
  `src/index.ts` looks for `src/hono`, in the legacy and the new module registry alike. Name source modules
  without a folder (`name = "index.ts", esModule = embed "src/index.ts"`) and `"hono"` resolves to the
  module named `hono`. Source files in subfolders would need the same flat naming.
- **The disk service sends every file as `application/octet-stream`.** Browsers refuse module
  scripts and stylesheets with that type. `src/assets.ts` sets `Content-Type` by extension.
- **A Response from a service binding has immutable headers.** `secureHeaders` threw "Can't modify
  immutable headers" on a passed-through 404 until `src/assets.ts` copied every response.
- **workerd refuses to start without system CA certificates**, even when the worker makes no outbound
  TLS calls: `No CA certificates were loaded from the system`. The image copies
  `ca-certificates.crt` from the fetch stage.
- **Each Hono entry is its own bundle**, so `hono/factory` carries a second copy of Hono. It didn't
  matter here: an `HTTPException` from `hono/http-exception` still became a clean 404 in the core app.
- **`--watch` restarts the isolate**, so in-memory state (the like counter) resets on every edit.
- **`compatibilityDate` can't be later than the workerd build date.**
- **Hono 5 is a release candidate** (`next` tag, 10 Oct 2026). Moving from 4.13.17 needed no code changes.

## Layout

| Path | What |
|---|---|
| `config.capnp` | Two workers (site on 8080, starter on 8081), module lists, disk service |
| `tsconfig.json` | For tsc only. `paths` maps `hono` and `hono/*` to the vendored types |
| `src/index.ts` | Hono app: middleware, pages, `app.route("/api", api)` |
| `src/api.ts` | Likes API with `validator` and `HTTPException` |
| `src/assets.ts` | `/assets/*` from the disk service, with content types |
| `src/pages.ts`, `src/layout.ts` | Pages as `html` tagged templates |
| `src/posts.ts` | Content as a TypeScript module |
| `starter/index.ts` | The official Hono starter, unchanged |
| `public/` | Served by workerd's disk service, bound as `PUBLIC`, under `/assets/` |
| `public/islands/like-button.js` | Custom element that upgrades server-rendered HTML; the button stays disabled without JS |
| `vendor/hono/` | Hono, fetched by `vendor.sh` |

## Run

```bash
docker compose up -d --build    # site on http://localhost:8080, starter on :8081
docker compose logs -f          # Hono's logger, reload messages and errors
docker compose run --rm check   # type check with native tsc
```

Edit anything in `src/` or `config.capnp` and refresh. Files in `public/` are read per request.

To use another Hono entry, add it to `ENTRIES` in `vendor.sh`, run it, and add the module to
`config.capnp`.

## Not tried yet

- JSX: needs a transform, which type stripping doesn't do.
- Durable Objects with `localDisk` storage instead of the in-memory counter.
- Running the same `src/` on Cloudflare with `wrangler deploy` and no build step (`no_bundle`).
- systemd unit on a Debian VM instead of Docker.
- The browser island in TypeScript: browsers don't strip types, so it stays `.js`.
