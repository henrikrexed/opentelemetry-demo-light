/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      '@grpc/grpc-js',
      '@grpc/proto-loader',
      '@opentelemetry/sdk-node',
      '@opentelemetry/auto-instrumentations-node',
      '@opentelemetry/exporter-trace-otlp-grpc',
    ],
  },
};

module.exports = nextConfig;
