# Cart (Java)

| | |
|---|---|
| **Language** | Java 17+ (JDK 21 in Docker) |
| **Port** | 7070 (gRPC) |
| **OTel Strategy** | Java Agent auto-instrumentation (zero code) |
| **Source** | `src/cart/` |

## How It Works

Manages shopping carts in Valkey (Redis-compatible) with per-user session keys and a configurable TTL.

## OTel Instrumentation

The OpenTelemetry Java Agent is attached via `-javaagent` JVM flag. **No OTel trace imports exist in the business logic.** The agent auto-instruments:

- gRPC server spans (every incoming RPC)
- Valkey/Redis client spans (Jedis GET, SET, DEL)
- JVM metrics (heap, GC, threads)

### Custom Metrics (Only OTel API Usage)

The service uses the OTel Metrics API for two business metrics -- the only `io.opentelemetry.api` imports in the codebase:

| Metric | Type | Description |
|--------|------|-------------|
| `app.cart.add.total` | Counter | Total add-to-cart operations |
| `app.cart.items.count` | Gauge | Items in the last-modified cart |

## Spans Produced (by Agent)

| Span | Source | Description |
|------|--------|-------------|
| `oteldemo.CartService/AddItem` | Agent (gRPC) | Add item RPC |
| `oteldemo.CartService/GetCart` | Agent (gRPC) | Get cart RPC |
| `oteldemo.CartService/EmptyCart` | Agent (gRPC) | Empty cart RPC |
| `GET` | Agent (Redis) | Valkey GET operation |
| `SETEX` | Agent (Redis) | Valkey SET with TTL |
| `DEL` | Agent (Redis) | Valkey DELETE |

## Key Files

| File | What to Study |
|------|--------------|
| `CartService.java` | Zero-trace-code business logic + custom metrics |
| `ValkeyCartStore.java` | Valkey storage (auto-instrumented by agent) |
| `Dockerfile` | Java agent attachment via `JAVA_TOOL_OPTIONS` |
