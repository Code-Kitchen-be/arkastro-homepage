# Build context: repository root
FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/shop/package.json apps/shop/
COPY packages/brand/package.json packages/brand/
RUN npm ci -w @arkastro/shop -w @arkastro/brand

FROM node:26-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/shop/node_modules ./apps/shop/node_modules
COPY package.json package-lock.json ./
COPY packages/brand ./packages/brand
COPY apps/shop ./apps/shop
WORKDIR /app/apps/shop
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8000
COPY --from=build /app/apps/shop/public ./public
COPY --from=build /app/apps/shop/.next/standalone ./
COPY --from=build /app/apps/shop/.next/static ./.next/static
EXPOSE 8000
CMD ["node", "apps/shop/server.js"]
