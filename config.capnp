using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "site", worker = .site),
    (name = "starter", worker = .starter),
    (name = "public", disk = (path = "/srv/public", writable = false)),
  ],
  sockets = [
    (name = "site", address = "*:8080", http = (), service = "site"),
    (name = "starter", address = "*:8081", http = (), service = "starter"),
  ],
);

# Every module a worker imports must be listed. workerd doesn't read undeclared
# files. A module's name is what code imports, so "hono/cors" resolves
# `import { cors } from "hono/cors"` the way npm would.
#
# Experimental: workerd strips TypeScript types at load. Needs `workerd serve --experimental`.

const site :Workerd.Worker = (
  compatibilityDate = "2026-11-01",
  compatibilityFlags = ["typescript_strip_types"],
  modules = [
    (name = "index.ts", esModule = embed "src/index.ts"),
    (name = "api.ts", esModule = embed "src/api.ts"),
    (name = "assets.ts", esModule = embed "src/assets.ts"),
    (name = "layout.ts", esModule = embed "src/layout.ts"),
    (name = "pages.ts", esModule = embed "src/pages.ts"),
    (name = "posts.ts", esModule = embed "src/posts.ts"),
    # Vendored by vendor.sh. Unused entries cost nothing; delete what you don't import.
    (name = "hono", esModule = embed "vendor/hono/index.js"),
    (name = "hono/html", esModule = embed "vendor/hono/html.js"),
    (name = "hono/cookie", esModule = embed "vendor/hono/cookie.js"),
    (name = "hono/factory", esModule = embed "vendor/hono/factory.js"),
    (name = "hono/streaming", esModule = embed "vendor/hono/streaming.js"),
    (name = "hono/http-exception", esModule = embed "vendor/hono/http-exception.js"),
    (name = "hono/validator", esModule = embed "vendor/hono/validator.js"),
    (name = "hono/logger", esModule = embed "vendor/hono/logger.js"),
    (name = "hono/cors", esModule = embed "vendor/hono/cors.js"),
    (name = "hono/secure-headers", esModule = embed "vendor/hono/secure-headers.js"),
    (name = "hono/etag", esModule = embed "vendor/hono/etag.js"),
    (name = "hono/request-id", esModule = embed "vendor/hono/request-id.js"),
    (name = "hono/timing", esModule = embed "vendor/hono/timing.js"),
    (name = "hono/body-limit", esModule = embed "vendor/hono/body-limit.js"),
    (name = "hono/csrf", esModule = embed "vendor/hono/csrf.js"),
  ],
  bindings = [
    (name = "PUBLIC", service = "public"),
  ],
);

# The official `npm create hono` cloudflare-workers starter, src/index.ts unchanged.
const starter :Workerd.Worker = (
  compatibilityDate = "2026-11-01",
  compatibilityFlags = ["typescript_strip_types"],
  modules = [
    (name = "index.ts", esModule = embed "starter/index.ts"),
    (name = "hono", esModule = embed "vendor/hono/index.js"),
  ],
);
