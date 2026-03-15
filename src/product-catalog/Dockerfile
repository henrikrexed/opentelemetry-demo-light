FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto

RUN apk add --no-cache ca-certificates

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /product-catalog .

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.25 && \
    wget -qO/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /grpc_health_probe

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /product-catalog /app/product-catalog
COPY --from=builder /grpc_health_probe /app/grpc_health_probe

EXPOSE 3550

ENTRYPOINT ["/app/product-catalog"]
