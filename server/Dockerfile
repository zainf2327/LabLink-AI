# Build stage
FROM node:24.18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:24.18-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir -p logs

EXPOSE 5001

CMD ["node", "dist/server.js"]
