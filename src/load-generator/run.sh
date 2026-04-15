#!/bin/sh
# Entrypoint for the k6 load generator.
#
# K6_OUTPUT_MODE selects the output extension:
#   opentelemetry    — xk6-output-opentelemetry (default)
#   output-dynatrace — xk6-output-dynatrace

OUTPUT="${K6_OUTPUT_MODE:-opentelemetry}"

exec /usr/bin/k6 run \
  --out "${OUTPUT}" \
  /scripts/test.js
