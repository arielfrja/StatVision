FROM node:20-slim

WORKDIR /app

# Install dependencies needed for build AND ffmpeg
RUN apt-get update && apt-get install -y openssl curl ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy workspace configuration
COPY package*.json ./
COPY worker/package*.json ./worker/
COPY common/package*.json ./common/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code
COPY common/ ./common/
COPY worker/ ./worker/

# Build common first, then worker
RUN npm run build -w common
RUN npm run build -w worker

# Prune dev dependencies
RUN npm prune --production

WORKDIR /app/worker
EXPOSE 8080

CMD ["node", "build/worker/src/startWorker.js"]
