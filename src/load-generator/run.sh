#!/bin/sh
# Entrypoint for the k6 load generator.
# Starts k6 with the xk6-output-opentelemetry extension sending
# metrics to the OTel Collector via OTLP/gRPC.

exec /usr/bin/k6 run \
  --out experimental-opentelemetry \
  /scripts/test.js
