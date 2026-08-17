# Stage 1: build React
FROM node:20-alpine AS frontend_build
WORKDIR /frontend

# Use .dockerignore to skip node_modules, .git, build artifacts

COPY front/package*.json ./
# ci, not install: install can silently resolve to newer transitive versions
# than package-lock.json records, so two builds of the same commit can differ.
# --legacy-peer-deps is retained - this tree has peer conflicts that npm 7+
# treats as fatal without it.
RUN npm ci --legacy-peer-deps

COPY front/ .
COPY front/.env .env
RUN npm run build

# Stage 2: nginx, unprivileged (uid 101, listens on 8080)
FROM nginxinc/nginx-unprivileged:1.29-alpine
# Put the nginx vhost config where nginx will load it by default
COPY ./nginx/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend_build /frontend/build /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
