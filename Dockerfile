FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/frontweb
COPY frontweb/package*.json ./
RUN npm ci
COPY frontweb/ ./
RUN npm run build

FROM node:20-bookworm-slim AS backend-deps

WORKDIR /app/backend-node
COPY backend-node/package*.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV WEB_DIST_PATH=/app/frontweb/dist
ENV STORAGE_LOCAL_PATH=/data/storage
ENV DATABASE_PATH=/data/drama_generator.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend-node
COPY --from=backend-deps /app/backend-node/node_modules ./node_modules
COPY backend-node/ ./
COPY --from=frontend-build /app/frontweb/dist /app/frontweb/dist

RUN mkdir -p /data/storage

EXPOSE 10000

CMD ["npm", "start"]
