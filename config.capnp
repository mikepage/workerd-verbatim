using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "site", worker = .site),
    (name = "public", disk = (path = "/srv/public", writable = false)),
  ],
  sockets = [
    (name = "http", address = "*:8080", http = (), service = "site"),
  ],
);

# Every module the worker imports must be listed here. workerd does not read
# undeclared files, so this list is the one thing kept by hand.
const site :Workerd.Worker = (
  compatibilityDate = "2026-11-01",
  # Experimental: workerd strips TypeScript annotations at load. Needs `workerd serve --experimental`.
  compatibilityFlags = ["typescript_strip_types"],
  modules = [
    (name = "src/worker.ts", esModule = embed "src/worker.ts"),
    (name = "src/layout.ts", esModule = embed "src/layout.ts"),
    (name = "src/pages.ts", esModule = embed "src/pages.ts"),
    (name = "src/posts.ts", esModule = embed "src/posts.ts"),
    (name = "vendor/hono.js", esModule = embed "vendor/hono.js"),
    (name = "vendor/hono-html.js", esModule = embed "vendor/hono-html.js"),
  ],
  bindings = [
    (name = "PUBLIC", service = "public"),
  ],
);
