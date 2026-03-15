# Kubernetes Deployment

Two deployment options: **Kustomize** (simple) and **Helm** (configurable).

## Option A: Kustomize

```bash
kubectl apply -k kubernetes/
```

This deploys all services into the `otel-demo-light` namespace.

### Access the Frontend

```bash
# Port-forward
kubectl port-forward -n otel-demo-light svc/frontend 8080:8080

# Or use NodePort (pre-configured at 30080)
open http://<node-ip>:30080
```

### View k6 Load Generator Logs

```bash
kubectl logs -n otel-demo-light -l app=load-generator -f
```

## Option B: Helm

```bash
helm install demo oci://ghcr.io/henrikrexed/opentelemetry-demo-light --version 0.1.0
```

### With Custom Values

```bash
helm install demo oci://ghcr.io/henrikrexed/opentelemetry-demo-light --version 0.1.0 \
  --set collector.resources.limits.memory=512Mi \
  --set loadGenerator.vus=10
```

### With a values file

```bash
helm install demo oci://ghcr.io/henrikrexed/opentelemetry-demo-light --version 0.1.0 -f my-values.yaml
```

See the [Helm Values Reference](helm-values.md) for all options.

### BYOB (No Collector)

```bash
helm install demo oci://ghcr.io/henrikrexed/opentelemetry-demo-light --version 0.1.0 \
  --set collector.enabled=false \
  --set otlp.endpoint=https://your-backend:4317
```

### With Gateway API

```bash
helm install demo oci://ghcr.io/henrikrexed/opentelemetry-demo-light --version 0.1.0 \
  --set gateway.enabled=true \
  --set gateway.provider=istio \
  --set gateway.hostname=demo.example.com
```

## Cleanup

=== "Kustomize"

    ```bash
    kubectl delete -k kubernetes/
    ```

=== "Helm"

    ```bash
    helm uninstall demo
    ```
