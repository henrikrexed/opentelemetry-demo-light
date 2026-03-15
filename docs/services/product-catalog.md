# Product Catalog (Go)

| | |
|---|---|
| **Language** | Go 1.22+ |
| **Port** | 3550 (gRPC) |
| **OTel Strategy** | Manual instrumentation (Go has no auto agent) |
| **Source** | `src/product-catalog/` |

## How It Works

Serves product data from PostgreSQL with an in-memory cache. Demonstrates Go's manual OTel SDK usage.

## OTel Instrumentation

Go requires explicit calls to create spans. This is the primary teaching service for manual instrumentation:

```go
ctx, span := tracer.Start(ctx, "GetProduct")
defer span.End()
span.SetAttributes(attribute.String("app.product.id", req.GetId()))
span.AddEvent("cache hit")
```

### Baggage Propagation

Reads incoming baggage from gRPC metadata, attaches values as span attributes, and adds `app.product.catalog_version` to outgoing baggage.

## Spans Produced

| Span | Attributes | Events |
|------|-----------|--------|
| `ListProducts` | `app.product.count` | `cache hit` |
| `GetProduct` | `app.product.id` | `cache hit`, `product not found` |
| `SearchProducts` | `app.search.query`, `app.product.count` | `search completed` |
| `loadProductsFromDB` | `app.product.count` | `querying products table`, `DB query completed` |

## Key Files

| File | What to Study |
|------|--------------|
| `main.go` | Manual span creation, baggage propagation |
| `telemetry.go` | TracerProvider + OTLP exporter setup |
| `db.go` | Database query with span instrumentation |
