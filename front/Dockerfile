# Stage 1: build React
FROM node:lts-alpine AS frontend_build
WORKDIR /frontend

# Use .dockerignore to skip node_modules, .git, build artifacts

COPY front/package*.json ./
RUN npm install --legacy-peer-deps

COPY front/ .
COPY front/.env.docker .env
RUN npm run build

# Stage 2: nginx
FROM nginx:alpine
COPY ./nginx/frontend/nginx.conf /etc/nginx/frontend/default.conf
COPY --from=frontend_build /frontend/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
