# syntax=docker/dockerfile:1
# --- Strapi CMS ---------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app
# Build toolchain for native deps (better-sqlite3, sharp).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY . .
# Raise Node's heap cap so the admin (vite) build survives on small build hosts (2 GB).
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# libvips runtime for sharp (image processing).
RUN apt-get update && apt-get install -y --no-install-recommends libvips42 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
EXPOSE 1337
CMD ["npm", "run", "start"]
