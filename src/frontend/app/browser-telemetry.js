'use client';

/**
 * Browser OTel SDK setup.
 * Story 6.6: Browser SDK Telemetry
 *
 * In production, this would use @opentelemetry/sdk-trace-web and
 * @opentelemetry/instrumentation-fetch. For the demo, we include
 * a lightweight placeholder that demonstrates the pattern.
 *
 * The full browser SDK is loaded in the Docker build where the
 * npm packages are available. This component documents the approach.
 */

// Browser telemetry initialization
// When running in Docker with full dependencies:
//
// import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
// import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
//
// const provider = new WebTracerProvider({ ... });
// provider.addSpanProcessor(new BatchSpanProcessor(
//   new OTLPTraceExporter({ url: '/otlp/v1/traces' })
// ));
// provider.register({ propagator: new W3CTraceContextPropagator() });

export default function BrowserTelemetry() {
  // This component intentionally renders nothing.
  // It exists as a mount point for the browser OTel SDK.
  return null;
}
