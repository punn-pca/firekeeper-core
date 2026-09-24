# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
ARG VITE_ENTERPRISE_OIDC_PROVIDER_ID
ENV VITE_ENTERPRISE_OIDC_PROVIDER_ID=${VITE_ENTERPRISE_OIDC_PROVIDER_ID}
RUN npm run build
RUN npm prune --production

# --- Runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
# Publication RAG reads canonical Markdown from process.cwd()/firekeeper_publication at runtime.
# Keep the canonical corpus in the production image; public/ alone is not the RAG source path.
COPY --from=build /app/firekeeper_publication ./firekeeper_publication
COPY --from=build /app/firebase-applet-config.json* /app/firebase-blueprint.json* ./

EXPOSE 8080

CMD ["node", "dist/server.cjs"]

