FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate protobuf code from the proto file (copied into build context)
RUN python -m grpc_tools.protoc -Iproto --python_out=. --grpc_python_out=. proto/demo.proto

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.25 && \
    wget -qO/app/grpc_health_probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /app/grpc_health_probe

EXPOSE 5050

# Use opentelemetry-instrument for auto-instrumentation wrapping
ENTRYPOINT ["opentelemetry-instrument", "python", "checkout_service.py"]
