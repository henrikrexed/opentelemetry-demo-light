# Product Catalog Service (Go)

## Overview

| | |
|---|---|
| **Language** | Go 1.22+ |
| **Port** | 3550 (gRPC) |
| **OTel Strategy** | Manual instrumentation (Go has no auto-instrumentation agent) |

## OTel Instrumentation

### Manual Spans

Go requires explicit span creation. Each gRPC handler creates a span:

```go
ctx, span := tracer.Start(ctx, "GetProduct")
defer span.End()
span.SetAttributes(attribute.String("app.product.id", req.GetId()))
```

### Custom Attributes

| Attribute | Description |
|-----------|-------------|
| `app.product.id` | Product ID being looked up |
| `app.product.count` | Number of products returned |
| `app.search.query` | Search query string |

### Span Events

- `cache hit` / `cache miss` -- product lookup result
- `DB query completed` -- database operation
- `products loaded from database` -- startup event

### Baggage Propagation

The service reads incoming baggage from gRPC metadata and attaches values as span attributes. It also demonstrates adding a new baggage entry (`app.product.catalog_version`).

## Key Files

| File | Purpose |
|------|---------|
| `main.go` | gRPC server, service implementation, baggage handling |
| `db.go` | PostgreSQL connection and product loading |
| `telemetry.go` | TracerProvider setup with OTLP exporter |
| `pq_array.go` | PostgreSQL text array scanner |
| `main_test.go` | Unit tests for all gRPC endpoints |

## Learning Objectives

- Manual span creation with `tracer.Start()`
- Setting custom attributes with `span.SetAttributes()`
- Adding span events with `span.AddEvent()`
- Reading and writing OTel baggage
- Configuring TracerProvider with OTLP gRPC exporter
