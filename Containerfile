FROM debian:13-slim AS fetch
ARG WORKERD_VERSION=v1.20261107.1
ARG TYPESCRIPT_VERSION=7.0.2
ARG TARGETARCH
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl
# workerd ships as one gzipped binary per platform.
RUN case "$TARGETARCH" in arm64) a=arm64 ;; *) a=64 ;; esac \
 && curl -fsSL "https://github.com/cloudflare/workerd/releases/download/${WORKERD_VERSION}/workerd-linux-${a}.gz" \
    | gunzip > /workerd \
 && chmod +x /workerd
# TypeScript 7 is a native Go binary: the platform package holds tsc and its lib .d.ts files.
RUN case "$TARGETARCH" in arm64) a=arm64 ;; *) a=x64 ;; esac \
 && mkdir /typescript \
 && curl -fsSL "https://registry.npmjs.org/@typescript/typescript-linux-${a}/-/typescript-linux-${a}-${TYPESCRIPT_VERSION}.tgz" \
    | tar -xz -C /typescript --strip-components=1

# Type check: `docker compose run --rm check`. Not needed to serve.
FROM debian:13-slim AS check
COPY --from=fetch /typescript /opt/typescript
WORKDIR /srv
CMD ["/opt/typescript/lib/tsc", "-p", "."]

# Runtime: plain Debian plus the one binary. No curl, no Node.
# workerd refuses to start without system CA certificates, even with no
# outbound TLS: "No CA certificates were loaded from the system".
FROM debian:13-slim
COPY --from=fetch /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=fetch /workerd /usr/local/bin/workerd
WORKDIR /srv
EXPOSE 8080 8081
CMD ["workerd", "serve", "--watch", "--experimental", "config.capnp"]
