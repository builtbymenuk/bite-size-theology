# Running the whole stack with Docker

One command brings up Postgres + Strapi (CMS) + the Next.js website:

```bash
cp .env.docker.example .env      # then fill it in (see below)
docker compose up -d --build
```

- Website → `http://<server-ip>:3000`
- Admin → `http://<server-ip>:1337/admin`

`docker compose down` stops it; `down -v` also wipes the database and uploaded images (the volumes).

## What's in the box

| Service | Image / build | Port | Data |
|---------|---------------|------|------|
| `db`  | postgres:16 | — (internal) | `db-data` volume |
| `cms` | `./cms/Dockerfile` (Strapi) | 1337 | `uploads` volume for media |
| `web` | `./Dockerfile` (Next, standalone) | 3000 | — |

The web container fetches Strapi **internally** (`STRAPI_URL=http://cms:1337`); the browser loads
CMS images from **`STRAPI_PUBLIC_URL`** — a host the visitor can actually reach. That split is why
there's no hairpin/iptables hack here.

## Filling in `.env`

Generate each Strapi secret with `openssl rand -base64 16`. `APP_KEYS` is a comma-separated list of
at least two. Set a strong `DATABASE_PASSWORD`. Set `STRAPI_PUBLIC_URL`:

- **IP-only:** `http://<server-ip>:1337`
- **With a domain:** `https://cms.yourdomain.com` (see TLS below)

`NEXT_PUBLIC_PAYPAL_CLIENT_ID` and `STRAPI_PUBLIC_URL` are **baked into the web image at build time**
— if you change either, rebuild: `docker compose up -d --build web`.

## Moving your existing content in

A fresh Postgres starts empty, so Strapi seeds its *default* content on first boot. To bring over the
content and images you've already created (from the SQLite dev DB or the current server):

```bash
# on the source (SQLite) Strapi:
npm run strapi export -- --no-encrypt --file backup     # -> backup.tar.gz
# copy backup.tar.gz to the box, then into the running cms container:
docker compose cp backup.tar.gz cms:/app/backup.tar.gz
docker compose exec cms npm run strapi import -- --file backup.tar.gz
```

This carries both the database records and the uploaded media.

## Adding a domain + HTTPS (optional)

For a real domain, put a reverse proxy (Caddy or nginx) in front so it terminates TLS and routes:

- `yourdomain.com` → `web:3000`
- `cms.yourdomain.com` → `cms:1337`

Then set `STRAPI_PUBLIC_URL=https://cms.yourdomain.com`, drop the public `ports:` on `web`/`cms`,
and point both DNS records at the server. Caddy gets you automatic certificates with a two-line
config. Ask and it can be added as a fourth service.

## Prerequisites on the server

```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # log out/in so `docker` runs without sudo
```

Or launch the Lightsail instance from the **Docker** blueprint (it's preinstalled). Building both
images needs ~2 GB RAM — same reason the demo box is 2 GB.
