# Payment Service (Rust)

## Overview

| | |
|---|---|
| **Language** | Rust 1.85+ |
| **Port** | 6060 (gRPC via tonic) |
| **OTel Strategy** | Manual instrumentation (`opentelemetry` crate) |

## OTel Instrumentation

### Manual Spans

Rust requires explicit span creation using the `opentelemetry` crate:

| Span Name | Kind | Purpose |
|-----------|------|---------|
| `payment.process` | Server | Top-level payment processing |
| `payment.validate` | Internal | Input validation (amount, card) |
| `payment.charge` | Internal | Mock charge operation |

### Custom Attributes

| Attribute | Description |
|-----------|-------------|
| `app.payment.amount_cents` | Payment amount in USD cents |
| `app.payment.transaction_id` | Generated UUID transaction ID |
| `app.payment.card_last_four` | Last 4 digits of card number |

### Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `app.payment.processed.total` | Counter | Total payments processed |
| `app.payment.amount.sum` | Counter | Total USD cents processed |

### Validation

- Amount must be positive and non-zero (returns `INVALID_ARGUMENT`)
- Credit card info must be present (returns `INVALID_ARGUMENT`)
- All payments succeed (mock -- no real gateway)

## Key Files

| File | Purpose |
|------|---------|
| `src/main.rs` | gRPC server, payment logic, OTel setup, all tests |
| `build.rs` | Proto compilation via `tonic-build` |
| `Cargo.toml` | Dependencies (tonic, opentelemetry, uuid) |
| `Dockerfile` | Multi-stage build (rust:1.85-alpine -> scratch, ~10MB image) |

## Learning Objectives

- Manual span creation in Rust with `opentelemetry` crate
- Configuring TracerProvider and MeterProvider with OTLP exporters
- Context extraction from gRPC metadata (W3C TraceContext)
- Comparing Rust manual instrumentation with Go manual instrumentation
- Building a minimal container image from a Rust static binary
