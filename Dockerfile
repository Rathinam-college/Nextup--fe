# ==============================================================================
# Task Tracker Enterprise - Frontend Dockerfile (Production Multi-Stage Build)
# ==============================================================================

# Stage 1: Build Vite React SPA
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm install

# Copy source and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Symlink nextup subpath for multi-app gateway compatibility
RUN ln -s /usr/share/nginx/html /usr/share/nginx/html/nextup

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
