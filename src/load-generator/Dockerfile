FROM grafana/xk6:latest AS builder

RUN xk6 build \
  --with github.com/grafana/xk6-output-opentelemetry

FROM alpine:3.19

COPY --from=builder /xk6/k6 /usr/bin/k6
COPY test.js /scripts/test.js
COPY run.sh /scripts/run.sh

RUN chmod +x /scripts/run.sh

ENV FRONTEND_URL=http://frontend:8080
ENV K6_VUS=5
ENV K6_DURATION=0
ENV K6_OTEL_GRPC_EXPORTER_INSECURE=true
ENV K6_OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
ENV OTEL_SERVICE_NAME=load-generator

ENTRYPOINT ["/scripts/run.sh"]
