FROM rust:1.85-alpine AS builder

RUN apk add --no-cache musl-dev protobuf-dev

WORKDIR /build

COPY Cargo.toml Cargo.lock* ./
COPY build.rs ./
COPY proto/ ./proto/
COPY src/ ./src/

RUN cargo build --release

# Download grpc_health_probe
RUN wget -qO/grpc_health_probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.25/grpc_health_probe-linux-amd64 && \
    chmod +x /grpc_health_probe

FROM scratch

COPY --from=builder /build/target/release/payment /app/payment
COPY --from=builder /grpc_health_probe /app/grpc_health_probe

EXPOSE 6060

ENTRYPOINT ["/app/payment"]
