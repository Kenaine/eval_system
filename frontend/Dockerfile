ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

FROM node:${NODE_VERSION}

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npx", "serve", "-s", "build", "-l", "3000"]