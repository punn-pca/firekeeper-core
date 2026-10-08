# --- Build stage ---
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_ENTERPRISE_OIDC_PROVIDER_ID
ENV VITE_ENTERPRISE_OIDC_PROVIDER_ID=${VITE_ENTERPRISE_OIDC_PROVIDER_ID}
RUN npm run lint && npm test && npm run test:publication-rag
RUN npm run build
RUN npm run test:production-http
RUN npm prune --omit=dev

# --- Runtime stage ---
FROM node:22-slim AS runtime
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

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.cjs"]

