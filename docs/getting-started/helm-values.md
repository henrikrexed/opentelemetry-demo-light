# Helm Values Reference

## Collector

| Key | Default | Description |
|-----|---------|-------------|
| `collector.enabled` | `true` | Deploy the OTel Collector. Set `false` for BYOB. |
| `collector.image` | `otel/opentelemetry-collector-contrib:0.98.0` | Collector image |
| `collector.replicas` | `1` | Collector replicas |
| `collector.resources.limits.memory` | `256Mi` | Memory limit |

When `collector.enabled=false`, all services send OTLP directly to `otlp.endpoint`.

## OTLP

| Key | Default | Description |
|-----|---------|-------------|
| `otlp.endpoint` | `http://otel-collector:4317` | OTLP endpoint (used when collector disabled) |
| `otlp.protocol` | `grpc` | `grpc` or `http` |

## Metrics

| Key | Default | Description |
|-----|---------|-------------|
| `metrics.aggregation` | `cumulative` | Sets `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE` on all services. Use `delta` for backends that prefer delta temporality (e.g., Datadog). |

## Gateway API

| Key | Default | Description |
|-----|---------|-------------|
| `gateway.enabled` | `false` | Create Gateway + HTTPRoute resources |
| `gateway.provider` | `""` | `istio`, `cilium`, `envoy`, `nginx` |
| `gateway.hostname` | `""` | e.g., `demo.example.com` |
| `gateway.className` | `""` | Override GatewayClass name (defaults to provider) |
| `gateway.tls.enabled` | `false` | Enable HTTPS listener |
| `gateway.tls.secretName` | `""` | TLS certificate Secret name |

## Per-Service Images

Each service image is configurable:

```yaml
images:
  frontend:
    repository: otel-demo-light/frontend
    tag: latest
    pullPolicy: IfNotPresent
  productCatalog:
    repository: otel-demo-light/product-catalog
    tag: latest
    pullPolicy: IfNotPresent
  cart:
    repository: otel-demo-light/cart
    tag: latest
    pullPolicy: IfNotPresent
  checkout:
    repository: otel-demo-light/checkout
    tag: latest
    pullPolicy: IfNotPresent
  payment:
    repository: otel-demo-light/payment
    tag: latest
    pullPolicy: IfNotPresent
  loadGenerator:
    repository: otel-demo-light/load-generator
    tag: latest
    pullPolicy: IfNotPresent
```

## Per-Service Configuration

Each service supports `replicas`, `port`, and `resources`:

| Service | Default Port | Default Memory Limit |
|---------|-------------|---------------------|
| `frontend` | 8080 | 250Mi |
| `productCatalog` | 3550 | 20Mi |
| `cart` | 7070 | 200Mi |
| `checkout` | 5050 | 50Mi |
| `payment` | 6060 | 10Mi |
| `loadGenerator` | 8089 | 300Mi |

Cart-specific: `cart.jvmOpts` (default: `-Xmx128m`)

Load generator: `loadGenerator.enabled`, `loadGenerator.users`, `loadGenerator.spawnRate`

## Examples

### BYOB with Grafana Cloud + Delta Metrics

```yaml
collector:
  enabled: false

otlp:
  endpoint: "https://otlp-gateway-prod-us-central-0.grafana.net/otlp"

metrics:
  aggregation: delta

loadGenerator:
  users: 10
  spawnRate: 2
```

### Gateway API with Istio + TLS

```yaml
gateway:
  enabled: true
  provider: istio
  hostname: demo.example.com
  tls:
    enabled: true
    secretName: demo-tls-cert
```

### Scaled Deployment (No Load Generator)

```yaml
frontend:
  replicas: 3
productCatalog:
  replicas: 2
cart:
  replicas: 2
checkout:
  replicas: 2
payment:
  replicas: 2
loadGenerator:
  enabled: false
collector:
  resources:
    limits:
      memory: 512Mi
```
