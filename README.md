# workerd-verbatim

A server-rendered TypeScript site with no build step, served by workerd on Debian. The files in
`src/` and `public/` are the files that run. No Node, npm, Bun or Deno: not to serve, not to
type check.

## Conclusion

It works. workerd strips TypeScript types at load, and TypeScript 7's native `tsc` checks them.
Both are single binaries fetched with curl.

| | |
|---|---|
| Runtime | workerd `v1.20261107.1`, `debian:13-slim`, nothing else installed |
| TypeScript | workerd's `typescript_strip_types` flag (experimental) runs `.ts` files as written |
| Type check | TypeScript `7.0.2` native `tsc` binary: 0.6 s for the whole project, container start included |
| Framework | Hono `5.0.0-rc.1`: `hono.js` (19 KB) + `hono-html.js` (2 KB) for workerd, `.d.ts` files for tsc |
| Code | ~200 lines across worker, pages, layout, data, island and `config.capnp` |
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
  Forget one and the request fails with a 500: `No such module "src/extra.js". imported from "src/pages.js"`.
- **Dependencies are a `vendor/` folder.** Only packages that bundle into self-contained ESM work.
  jsDelivr's `/+esm` gives that for Hono; its types come from the npm tarball. `vendor.sh` pins the version.
- **No `@cloudflare/workers-types`.** Binding types are written out by hand (`Env` in `src/worker.ts`).
- **No minification or cache-busting hashes** on browser assets.

## Surprises

- **The disk service sends every file as `application/octet-stream`.** Browsers refuse module
  scripts and stylesheets with that type. The worker sets `Content-Type` by extension
  (`src/worker.ts`).
- **workerd refuses to start without system CA certificates**, even when the worker makes no outbound
  TLS calls: `No CA certificates were loaded from the system`. The image copies
  `ca-certificates.crt` from the fetch stage.
- **`--watch` restarts the isolate**, so in-memory state (the like counter) resets on every edit.
- **`compatibilityDate` can't be later than the workerd build date.**
- **Hono 5 is a release candidate** (`next` tag, 10 Oct 2026). Moving from 4.13.17 needed no code changes
  for `c.html`, `c.json`, `c.req.param`, `app.notFound` or bindings.
- **Imports name the `.ts` file** (`./posts.ts`), because workerd resolves the module names in
  `config.capnp` as written. `allowImportingTsExtensions` lets tsc accept that.

## Layout

| Path | What |
|---|---|
| `config.capnp` | workerd config: services, socket, module list, bindings, `typescript_strip_types` |
| `tsconfig.json` | For tsc only: `noEmit`, `erasableSyntaxOnly`, `allowImportingTsExtensions` |
| `src/worker.ts` | Hono app: routes, likes API, static files with content types |
| `src/pages.ts`, `src/layout.ts` | Pages as `html` tagged templates |
| `src/posts.ts` | Content as a TypeScript module |
| `public/` | Served by workerd's disk service, bound as `PUBLIC`, under `/assets/` |
| `public/islands/like-button.js` | Custom element that upgrades server-rendered HTML; the button stays disabled without JS |
| `vendor/` | Hono, fetched by `vendor.sh` |

## Run

```bash
docker compose up -d --build    # http://localhost:8080
docker compose logs -f          # reload messages and errors
docker compose run --rm check   # type check with native tsc
```

Edit anything in `src/` or `config.capnp` and refresh. Files in `public/` are read per request.

To upgrade Hono, change `HONO=` in `vendor.sh` and run it.

## Not tried yet

- Durable Objects with `localDisk` storage instead of the in-memory counter.
- Running the same `src/` on Cloudflare with `wrangler deploy` and no build step (`no_bundle`).
- systemd unit on a Debian VM instead of Docker.
- The browser island in TypeScript: browsers don't strip types, so it stays `.js`.
