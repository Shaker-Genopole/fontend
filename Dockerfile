# syntax=docker/dockerfile:1.7
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
# Live mode reads /api from the ZK-SLA api-gateway; set false for the static synthetic demo.
ARG VITE_LIVE_API=true
ENV VITE_LIVE_API=${VITE_LIVE_API}
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine
ENV API_UPSTREAM=http://api-gateway:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
