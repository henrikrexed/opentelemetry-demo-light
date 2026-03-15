FROM grafana/k6:1.6.1

COPY test.js /scripts/test.js
COPY run.sh /scripts/run.sh

USER root
RUN chmod +x /scripts/run.sh
USER k6

ENV FRONTEND_URL=http://frontend:8080
ENV K6_VUS=5
ENV K6_DURATION=87600h
ENV K6_OTEL_GRPC_EXPORTER_INSECURE=true
ENV K6_OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
ENV OTEL_SERVICE_NAME=load-generator

ENTRYPOINT ["/scripts/run.sh"]
