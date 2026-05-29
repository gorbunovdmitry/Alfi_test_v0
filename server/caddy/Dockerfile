# Caddy with the DuckDNS DNS module (for DNS-01 certs — no ports 80/443 needed).
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/duckdns

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
