# Production image for Railway.
# Node is pinned to an exact patch version (Nixpacks could only pin the major).
# To upgrade after a Node security release: bump NODE_VERSION, push, then check
# the Railway build log shows the new tag.
ARG NODE_VERSION=22.23.5

# ── Build: install all deps (incl. dev), build the client, drop dev deps ──
FROM node:${NODE_VERSION}-trixie-slim AS build
# Toolchain only as a fallback if a native module (argon2, sqlite3, sharp)
# has no prebuilt binary for this platform.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
# npm install (not ci): the lockfile is generated on macOS, and npm ci can skip
# Linux-only optional native packages (npm bug #4828).
RUN npm install --include=dev --include=optional

COPY . .
RUN npm run build && npm prune --omit=dev

# ── Runtime: no compiler, no dev deps ──
FROM node:${NODE_VERSION}-trixie-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/server
# Runs as root: the Railway volume mounted on /data is owned by root.
CMD ["node", "src/index.js"]
