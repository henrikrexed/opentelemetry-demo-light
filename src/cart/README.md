# Cart Service (Java)

## Overview

| | |
|---|---|
| **Language** | Java 17+ (JDK 21 in Docker) |
| **Port** | 7070 (gRPC) |
| **OTel Strategy** | Java Agent auto-instrumentation (zero code) |

## OTel Instrumentation

### Java Agent (Auto)

The service uses the OpenTelemetry Java agent attached via `-javaagent` JVM flag. The agent automatically instruments:

- **gRPC server spans** -- every incoming RPC call
- **Valkey/Redis client spans** -- Jedis GET, SET, DEL operations
- **JVM metrics** -- heap, GC, threads

**No OTel API imports exist in the business logic code.** The only OTel usage is the Metrics API for custom business metrics.

### Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `app.cart.add.total` | Counter | Total add-to-cart operations |
| `app.cart.items.count` | Gauge | Number of items in the last-modified cart |

These are the only lines that import `io.opentelemetry.api` -- demonstrating how to add domain-specific metrics alongside pure auto-instrumentation.

## Key Files

| File | Purpose |
|------|---------|
| `CartService.java` | gRPC service implementation + custom metrics |
| `ValkeyCartStore.java` | Valkey/Redis storage via Jedis |
| `CartStore.java` | Storage interface (for testability) |
| `CartItemEntry.java` | Cart item POJO |
| `CartApplication.java` | Application entry point |
| `CartServiceTest.java` | Unit tests with in-memory store |
| `Dockerfile` | Multi-stage build with OTel Java agent |

## Learning Objectives

- How the Java agent instruments gRPC and Redis with zero code changes
- How to add custom metrics alongside auto-instrumentation
- The difference between auto-instrumented spans and manual metrics
- JVM configuration for the OTel agent (`JAVA_TOOL_OPTIONS`)
