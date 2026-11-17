# Build context: repository root
FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/medusa/package.json apps/medusa/
RUN npm ci -w @arkastro/medusa

FROM node:26-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/medusa/node_modules ./apps/medusa/node_modules
COPY package.json package-lock.json ./
COPY apps/medusa ./apps/medusa
WORKDIR /app/apps/medusa
RUN npm run build

FROM node:26-bookworm-slim AS runner
WORKDIR /app/apps/medusa
ENV NODE_ENV=production
COPY --from=build /app/apps/medusa/.medusa/server ./
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/medusa/package.json ./package.json
EXPOSE 9000
CMD ["npx", "medusa", "start"]
