FROM gradle:9.8.2-jdk21 AS builder

WORKDIR /build

COPY build.gradle settings.gradle ./
COPY src ./src

RUN gradle fatJar --no-daemon

# Download OTel Java agent
RUN wget -qO/opentelemetry-javaagent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.33.1/opentelemetry-javaagent.jar

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.61 &&     wget -qO/grpc_health_probe     https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 &&     chmod +x /grpc_health_probe

FROM eclipse-temurin:25-jre-alpine

# CVE gate (ISI-6873/ISI-6883): temurin pins a stale alpine snapshot; pull patched packages.
# Base bumped 24-jre-alpine (alpine 3.22, brotli-libs 1.1.1-r0) -> 25-jre-alpine (alpine 3.24,
# brotli-libs 1.2.1-r0) to clear CVE-2026-111497; apk upgrade alone could not (3.22 repo caps at 1.1.1-r0).
RUN apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /build/build/libs/cart-1.0.0-all.jar /app/cart.jar
COPY --from=builder /opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
COPY --from=builder /grpc_health_probe /app/grpc_health_probe

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar -Xmx128m"

EXPOSE 7070

ENTRYPOINT ["java", "-jar", "/app/cart.jar"]
