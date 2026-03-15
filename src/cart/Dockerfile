FROM gradle:8.6-jdk21-alpine AS builder

WORKDIR /build

COPY build.gradle settings.gradle ./
COPY src ./src

RUN gradle fatJar --no-daemon

# Download OTel Java agent
RUN wget -qO/opentelemetry-javaagent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.2.0/opentelemetry-javaagent.jar

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.25 && \
    wget -qO/grpc_health_probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /grpc_health_probe

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /build/build/libs/cart-1.0.0-all.jar /app/cart.jar
COPY --from=builder /opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
COPY --from=builder /grpc_health_probe /app/grpc_health_probe

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar -Xmx128m"

EXPOSE 7070

ENTRYPOINT ["java", "-jar", "/app/cart.jar"]
