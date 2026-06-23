# syntax=docker/dockerfile:1

# ---- Build stage --------------------------------------------------
# glibc (bookworm) is required: pnpm-workspace.yaml pins libc: glibc,
# so the lockfile only resolves glibc native binaries (e.g. rollup).
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install deps first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build the static site (vite build -> /app/dist)
COPY . .
RUN pnpm run build

# ---- Runtime stage ------------------------------------------------
# Static files only; no Node at runtime.
FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/lbk-12c.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
