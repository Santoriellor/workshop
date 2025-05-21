# Base stage (for dev & prod)
# front/Dockerfile
FROM node:lts-alpine AS base

# Set working directory
WORKDIR /frontend

# Copy env specific to Docker build
COPY front/.env.docker .env

# Install dependencies
COPY front/package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY front/ .

# Development stage
FROM base AS dev
CMD ["npm", "start"]

# Production build stage
FROM base AS build
RUN npm run build

# Production final image
# Use nginx to serve built files
FROM nginx:alpine AS prod
COPY --from=build /frontend/build /usr/share/nginx/html
COPY front/nginx.conf /etc/nginx/conf.d/default.conf

# Expose application port
EXPOSE 80
