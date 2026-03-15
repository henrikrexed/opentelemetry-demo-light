# Checkout Service (Python)

## Overview

| | |
|---|---|
| **Language** | Python 3.12 |
| **Port** | 5050 (gRPC) |
| **OTel Strategy** | Auto + Manual hybrid |

## OTel Instrumentation

### Auto-Instrumentation

The service runs with `opentelemetry-instrument` as the entrypoint wrapper, which auto-instruments:

- **gRPC server/client spans** -- incoming PlaceOrder + outgoing calls to Cart, Product Catalog, Payment
- **PostgreSQL query spans** -- order storage via psycopg2

### Manual Spans

Business logic operations get explicit manual spans:

| Span Name | Purpose |
|-----------|---------|
| `checkout.place_order` | Top-level orchestration span |
| `checkout.calculate_total` | Price lookup and total calculation |
| `checkout.shipping_calc` | Flat-rate shipping calculation |
| `checkout.send_confirmation` | Order confirmation logging |

### Custom Attributes

| Attribute | Description |
|-----------|-------------|
| `app.order.id` | Order UUID |
| `app.order.total` | Total in USD cents |
| `app.order.items.count` | Number of line items |
| `app.payment.transaction_id` | Payment transaction UUID |
| `app.user.id` | User/session identifier |

### Structured Logging (Trace Correlation)

Log entries include `trace_id` and `span_id` fields for trace-log correlation:

```
2024-01-15 10:30:00 INFO [checkout] [trace_id=abc123 span_id=def456] Order placed: order_id=...
```

## Key Files

| File | Purpose |
|------|---------|
| `checkout_service.py` | gRPC server, PlaceOrder orchestration, all OTel instrumentation |
| `test_checkout.py` | Unit tests (shipping calc, total calc, empty cart) |
| `requirements.txt` | Python dependencies including OTel packages |
| `Dockerfile` | Build with `opentelemetry-instrument` entrypoint |

## Orchestration Flow

```
PlaceOrder
  |-- GetCart (Cart service, gRPC)
  |-- GetProduct x N (Product Catalog, gRPC)
  |-- CalculateTotal (inline)
  |-- ProcessPayment (Payment service, gRPC)
  |-- CalculateShipping (inline, flat rate)
  |-- StoreOrder (PostgreSQL)
  |-- EmptyCart (Cart service, gRPC)
  +-- LogConfirmation (structured log)
```

## Learning Objectives

- How `opentelemetry-instrument` auto-wraps a Python application
- How to add manual spans alongside auto-instrumentation
- How to correlate logs with traces using trace_id and span_id
- Orchestrating multiple gRPC calls with context propagation
