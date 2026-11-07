#!/bin/sh
# Fetch Hono with curl, no npm:
#   vendor/hono.js, vendor/hono-html.js  self-contained ES modules from jsDelivr, run by workerd
#   vendor/types/                         Hono's .d.ts files from the npm tarball, read by tsc only
# Bump HONO and rerun to upgrade. The files are committed as-is.
set -eu
HONO=5.0.0-rc.1
cd "$(dirname "$0")"
rm -rf vendor && mkdir -p vendor/types

curl -fsSL -o vendor/hono.js "https://cdn.jsdelivr.net/npm/hono@${HONO}/+esm"
curl -fsSL -o vendor/hono-html.js "https://cdn.jsdelivr.net/npm/hono@${HONO}/dist/helper/html/index.js/+esm"
# jsDelivr appends a sourceMappingURL to its own CDN; drop it.
sed -i.bak '/^\/\/# sourceMappingURL=/d' vendor/hono.js vendor/hono-html.js && rm vendor/*.bak

curl -fsSL -o vendor/hono.tgz "https://registry.npmjs.org/hono/-/hono-${HONO}.tgz"
tar -xzf vendor/hono.tgz -C vendor/types --strip-components=2 --include='package/dist/*.d.ts' --include='package/dist/**/*.d.ts'
tar -xzf vendor/hono.tgz -C vendor --strip-components=1 package/LICENSE && mv vendor/LICENSE vendor/LICENSE-hono
rm vendor/hono.tgz

# tsc picks up a .d.ts next to the .js it imports.
echo 'export * from "./types/index.js";' > vendor/hono.d.ts
echo 'export * from "./types/helper/html/index.js";' > vendor/hono-html.d.ts
