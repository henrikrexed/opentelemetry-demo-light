FROM golang:1.25-alpine AS builder

ENV GOTOOLCHAIN=auto
RUN apk add --no-cache git gcc musl-dev
RUN go install go.k6.io/xk6/cmd/xk6@latest

RUN xk6 build v1.6.1 \
  --with github.com/henrikrexed/henrikrexed-xk6-output-opentelemetry@latest

FROM alpine:3.19

COPY --from=builder /go/k6 /usr/bin/k6
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
