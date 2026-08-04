# syntax=docker/dockerfile:1
# --- Next.js website (standalone) ---------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Baked at build time: image-host allowlist (remotePatterns) + the public PayPal client id.
ARG STRAPI_PUBLIC_URL
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV STRAPI_PUBLIC_URL=$STRAPI_PUBLIC_URL \
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# standalone output ships its own trimmed node_modules + server.js; static/ and public/ are separate.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
