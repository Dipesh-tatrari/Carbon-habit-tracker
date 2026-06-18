# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install development and production dependencies
RUN npm install

# Copy source files
COPY . .

# Build Vite application for production
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built assets from build stage to Nginx directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
