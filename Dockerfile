# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN npm install

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only production deps are needed at runtime (esbuild bundled server.ts with --packages=external,
# so node_modules must still be present for those external packages, e.g. express, firebase-admin).
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/server.cjs"]
