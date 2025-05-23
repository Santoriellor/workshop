# Dockerfile for React and Nginx

# Stage 1: Build React app
FROM node:lts-alpine AS frontend_build

# Set working directory
WORKDIR /frontend

# Install dependencies
COPY front/package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY front/ .
# Replace env specific to Docker build
COPY front/.env.docker .env

RUN npm run build

# Stage 2: nginx serving frontend + backend static files
FROM nginx:alpine

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build files from previous stage
COPY --from=frontend_build /frontend/build /usr/share/nginx/html

# The backend static files will be mounted as a volume at runtime

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]