FROM node:25-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:25-alpine

# CVE gate (ISI-6873): pull patched alpine packages (openssl CVE-2026-14456/45447)
RUN apk upgrade --no-cache     && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/proto ./proto
# Proto must also be at the path webpack resolves via __dirname in route bundles
COPY --from=builder /app/proto ./.next/server/proto
COPY --from=builder /app/proto ./.next/server/app/proto
COPY --from=builder /app/proto ./.next/server/app/api/proto
COPY --from=builder /app/proto ./.next/server/chunks/proto
COPY --from=builder /app/instrumentation.js ./instrumentation.js

# grpc_health_probe for health checks
RUN wget -qO/app/grpc_health_probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.60/grpc_health_probe-linux-amd64 && \
    chmod +x /app/grpc_health_probe

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

CMD ["node", "server.js"]
