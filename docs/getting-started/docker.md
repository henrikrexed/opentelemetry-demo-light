# Docker Compose Quickstart

## Prerequisites

- Docker and Docker Compose v2+
- ~1.5 GB free RAM

## Start the Demo

```bash
git clone https://github.com/your-org/opentelemetry-demo-light.git
cd opentelemetry-demo-light
docker compose up -d
```

All 9 containers start in dependency order. The full stack is healthy in about 60 seconds.

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Storefront | [http://localhost:8080](http://localhost:8080) | Browse, add to cart, checkout |
| Locust UI | [http://localhost:8089](http://localhost:8089) | Load generator dashboard |
| Collector OTLP | `localhost:4317` (gRPC), `localhost:4318` (HTTP) | Send/receive telemetry |

## View Telemetry

By default, telemetry goes to the `debug` exporter (console):

```bash
docker compose logs -f otel-collector
```

### Add Jaeger (one command)

```bash
docker compose --profile jaeger up -d
```

Open [http://localhost:16686](http://localhost:16686) to see traces.

### Connect a Cloud Backend

```bash
cp .env.example .env
```

Edit `.env`:

=== "Grafana Cloud"

    ```env
    OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
    OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64>
    ```

=== "Dynatrace"

    ```env
    OTEL_EXPORTER_OTLP_ENDPOINT=https://{env-id}.live.dynatrace.com/api/v2/otlp
    OTEL_EXPORTER_OTLP_HEADERS=Authorization=Api-Token <token>
    ```

=== "Generic OTLP"

    ```env
    OTEL_EXPORTER_OTLP_ENDPOINT=https://your-backend:4317
    ```

Then uncomment the `otlp` exporter in `otel-collector-config.yaml` and restart:

```bash
docker compose restart otel-collector
```

## Useful Commands

```bash
make up        # Start all services
make down      # Stop all services
make logs      # Tail all logs
make clean     # Stop + remove volumes
```

## GitHub Codespaces

Click **"Open in Codespace"** from the repo page. The `.devcontainer/devcontainer.json` starts everything automatically with port forwarding.
