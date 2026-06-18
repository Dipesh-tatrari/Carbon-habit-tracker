FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy server files
COPY server/ ./server/

# Expose port and start server
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
