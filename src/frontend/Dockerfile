FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/proto ./proto
# Proto must also be at the path webpack resolves via __dirname in route bundlesCOPY --from=builder /app/proto ./.next/server/protoCOPY --from=builder /app/proto ./.next/server/app/protoCOPY --from=builder /app/proto ./.next/server/app/api/protoCOPY --from=builder /app/proto ./.next/server/chunks/proto
COPY --from=builder /app/instrumentation.js ./instrumentation.js

# grpc_health_probe for health checks
RUN wget -qO/app/grpc_health_probe     https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.25/grpc_health_probe-linux-amd64 &&     chmod +x /app/grpc_health_probe

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

CMD ["node", "server.js"]
