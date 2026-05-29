# Alfi backend (isolated)

Chat proxy for «Финансовая неделя»: holds the AITUNNEL key and forwards to `gpt-5.4-nano`.
Runs as a **fully isolated** Docker stack — shares nothing with naimoteka.

## What it is
- `proxy/` — tiny Node service, exposes `POST /api/chat` (internal port 8090, not published).
- `caddy/` — Caddy with the DuckDNS module; terminates HTTPS on **:8443**, cert via DNS-01.
- Project name `alfi`, network `alfi_internal`, volumes `alfi_caddy_*`. Host port: **8443 only**.

## Deploy
```bash
# on the server, in /opt/alfi/server
cp .env.example .env        # then fill secrets (see below)
docker compose -p alfi up -d --build
```

## .env (create on the server, never commit)
`/opt/alfi/server/.env`:
```
AITUNNEL_API_KEY=...            # AITunnel key
AITUNNEL_MODEL=gpt-5.4-nano
ALFI_DOMAIN=alfi-demo.duckdns.org
DUCKDNS_TOKEN=...               # DuckDNS token
ALLOWED_ORIGIN=https://gorbunovdmitry.github.io
```
To change a value: edit `.env`, then `docker compose -p alfi up -d` (recreates containers).

## Operate
```bash
docker compose -p alfi ps                 # status
docker compose -p alfi logs -f --tail=100 # logs (proxy + caddy)
docker compose -p alfi restart            # restart
docker compose -p alfi down               # stop (keeps volumes/certs)
```

## Health
- `https://$ALFI_DOMAIN:8443/health` → `{"ok":true}`
- Public chat endpoint used by the frontend: `https://$ALFI_DOMAIN:8443/api/chat`

## Isolation guarantees
- No ports 80/443/5432/8000/8080. Only 8443.
- Никаких изменений в `/opt/naimoteka/`, её networks/volumes/nginx.
