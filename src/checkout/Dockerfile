FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# Install deps, then strip pip itself. The checkout runtime never invokes pip, and pip's
# bundled _vendor tree carries CVE-flagged copies of urllib3 2.7.0 / msgpack 1.1.2 /
# setuptools 70.3.0 (CVE-2026-97687, CVE-2026-97689, CVE-2026-114613, GHSA-6v7p-g79w-8964,
# CVE-2025-47273). pip freezes those vendored versions internally — pip 26.2.2 (latest)
# still ships them — so they are not fixable via requirements pins. Removing pip removes
# the vendored copies, keeping the .trivyignore fixable baseline at 0 (ISI-6867).
# Standalone setuptools (84.2.1, from requirements.txt) is retained.
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m pip uninstall -y pip

COPY . .

# Generate protobuf code from the proto file (copied into build context)
RUN python -m grpc_tools.protoc -Iproto --python_out=. --grpc_python_out=. proto/demo.proto

# Download grpc_health_probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.61 && \
    wget -qO/app/grpc_health_probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /app/grpc_health_probe

EXPOSE 5050

# Use opentelemetry-instrument for auto-instrumentation wrapping
ENTRYPOINT ["opentelemetry-instrument", "python", "checkout_service.py"]
