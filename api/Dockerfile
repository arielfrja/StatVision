FROM node:20-slim

WORKDIR /app

# Install dependencies needed for build
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy workspace configuration
COPY package*.json ./
COPY api/package*.json ./api/
COPY common/package*.json ./common/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code
COPY common/ ./common/
COPY api/ ./api/

# Build common first, then api
RUN npm run build -w common
RUN npm run build -w api

# Prune dev dependencies (npm prune --production in workspaces is tricky, often simpler to just run in WORKDIR /app)
RUN npm prune --production

WORKDIR /app/api
EXPOSE 3000

CMD ["node", "build/api/src/app.js"]
