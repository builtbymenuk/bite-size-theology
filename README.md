# Bite Size Theology

The Bite Size Theology website and its content management system.

Two applications run side by side:

| | What it is | Port |
|---|---|---|
| **root** | The public website — Next.js 16 | `3000` |
| **`cms/`** | The admin + content API — Strapi 5 | `1337` |

Everything on the public site — text, images, products, prices, podcast episodes,
page settings — is edited in the Strapi admin. No code changes needed for content.

## Running it locally

See **[HOW-TO-RUN.md](HOW-TO-RUN.md)**. Short version: start Strapi first
(`cd cms && npm install && npm run develop`), then the site (`npm install && npm run dev`).

The site runs even with the CMS switched off — it falls back to built-in copy — so you
can start the website on its own and connect the CMS afterwards.

## Configuration

Environment variables are documented inline in **[`.env.example`](.env.example)** (website)
and **[`cms/.env.example`](cms/.env.example)** (CMS). Copy each to `.env.local` and `cms/.env`
respectively and fill them in. Nothing secret is committed to this repository.

## Deploying

A complete Docker setup is included — `docker-compose.yml` brings up PostgreSQL, the CMS and
the website together:

```bash
cp .env.docker.example .env    # then fill it in
docker compose up -d --build
```

Both applications can also be run directly with Node 20+ behind any process manager.

## Important

The repository contains the **software**, not the **content**. The database and every
uploaded image live outside it. Moving a site to a new server means moving those separately
with Strapi's own export and import commands:

```bash
cd cms
npm run strapi export -- --no-encrypt --file backup   # on the old server
npm run strapi import -- --force --file backup.tar.gz # on the new one
```

Back both up regularly — a database backup without the uploads folder restores a site with
no pictures.
