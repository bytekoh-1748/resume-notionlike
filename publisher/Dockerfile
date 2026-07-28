FROM node:24-bookworm-slim

WORKDIR /workspace/publisher

COPY publisher/package.json publisher/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY publisher/ ./
COPY frontend/ /workspace/frontend/

CMD ["node", "build.mjs"]
