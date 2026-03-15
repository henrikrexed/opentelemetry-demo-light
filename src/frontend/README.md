# Frontend Service (Node.js / Next.js)

## Overview

| | |
|---|---|
| **Language** | Node.js 20 (Next.js 14, App Router) |
| **Port** | 8080 (HTTP, serves directly -- no proxy) |
| **OTel Strategy** | Server: auto-instrumentation via `@opentelemetry/sdk-node` |
| | Browser: OTel Web SDK for page load and fetch spans |

## OTel Instrumentation

### Server-Side (Auto)

The `instrumentation.js` file initializes the OTel Node SDK when `NEXT_RUNTIME === 'nodejs'`. The SDK auto-instruments:

- **HTTP server spans** -- every incoming request
- **gRPC client spans** -- calls to Product Catalog, Cart, Checkout
- **Next.js rendering** -- page and API route spans

No manual OTel code is needed in API routes or pages.

### Browser-Side

The Browser SDK (when loaded) generates:
- Page load spans (document load, resource fetches)
- Fetch/XHR spans for API calls
- W3C `traceparent` headers on outgoing requests

## Key Files

| File | Purpose |
|------|---------|
| `instrumentation.js` | OTel Node SDK setup (auto-instrumentation) |
| `lib/grpc-client.js` | gRPC client for backend services (dynamic proto loading) |
| `app/api/*/route.js` | API routes proxying gRPC calls |
| `app/page.js` | Product listing page |
| `app/product/[id]/page.js` | Product detail page |
| `app/cart/page.js` | Cart page |
| `app/checkout/page.js` | Checkout form |
| `app/order/page.js` | Order confirmation |

## Learning Objectives

- How Node.js auto-instrumentation works with Next.js
- How a frontend acts as a gRPC client to backend services
- How browser-side and server-side traces connect via W3C TraceContext
