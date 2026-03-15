# Load Generator (k6 + xk6-output-opentelemetry)

## Overview

| | |
|---|---|
| **Tool** | [k6](https://k6.io/) with [xk6-output-opentelemetry](https://github.com/henrikrexed/henrikrexed-xk6-output-opentelemetry) |
| **Language** | JavaScript (k6 runtime) |
| **OTel Integration** | Native OTLP export via `--out experimental-opentelemetry` |
| **Source** | `src/load-generator/` |

## How It Works

k6 simulates user journeys against the Frontend HTTP API. The xk6-output-opentelemetry extension exports k6 metrics (request durations, error rates, VU counts) directly to the OTel Collector via OTLP/gRPC — no separate instrumentation needed.

## User Journey

Each virtual user (VU) executes this flow in a loop:

1. **Browse products** — `GET /api/products`
2. **View product detail** — `GET /api/product/:id` (random product)
3. **Add to cart** — `POST /api/cart/add` (random product, 1-3 qty)
4. **View cart** — `GET /api/cart`
5. **Checkout** (33% of iterations) — `POST /api/checkout`

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `FRONTEND_URL` | `http://frontend:8080` | Target URL |
| `K6_VUS` | `5` | Virtual users (concurrency) |
| `K6_DURATION` | `0` (infinite) | Test duration (`30s`, `5m`, `0`=forever) |
| `K6_OTEL_EXPORTER_OTLP_ENDPOINT` | `http://otel-collector:4317` | OTLP endpoint |
| `K6_OTEL_GRPC_EXPORTER_INSECURE` | `true` | Use insecure gRPC |

## Key Files

| File | Purpose |
|------|---------|
| `test.js` | k6 test script with user journey simulation |
| `run.sh` | Entrypoint that starts k6 with OTel output |
| `Dockerfile` | Builds k6 binary with xk6-output-opentelemetry extension |

## Metrics Exported to OTel

k6 exports standard load testing metrics via OTLP:

- `k6_http_req_duration` — HTTP request duration
- `k6_http_req_failed` — Failed request rate
- `k6_http_reqs` — Total requests
- `k6_vus` — Active virtual users
- `k6_iterations` — Completed iterations
