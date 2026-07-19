FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled JavaScript from local build
COPY dist ./dist

# Create logs directory
RUN mkdir -p logs

EXPOSE 5001

# Run the compiled JS server directly
CMD ["node", "dist/server.js"]
