# front/Dockerfile
FROM node:lts-alpine

# Set working directory
WORKDIR /frontend

# Install dependencies
COPY front/package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY front/ .

# Build React app
RUN npm run build

# Expose application port
EXPOSE 3000

# Use nginx to serve built files
FROM nginx:alpine
COPY --from=0 /frontend/build /usr/share/nginx/html
COPY front/nginx.conf /etc/nginx/conf.d/default.conf
