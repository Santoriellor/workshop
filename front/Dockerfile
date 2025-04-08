# front/Dockerfile
FROM node:18.20.7

# Set working directory
WORKDIR /frontend

# Install dependencies
COPY front/package*.json ./
RUN npm install

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
