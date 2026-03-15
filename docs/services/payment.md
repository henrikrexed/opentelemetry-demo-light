# Payment (Rust)

| | |
|---|---|
| **Language** | Rust 1.85+ |
| **Port** | 6060 (gRPC via tonic) |
| **OTel Strategy** | Manual instrumentation (`opentelemetry` crate) |
| **Source** | `src/payment/` |

## How It Works

A mock payment processor. Validates input, generates a UUID transaction ID, and always succeeds. The ~10 MB container image demonstrates Rust's minimal footprint.

## OTel Instrumentation

Uses the `opentelemetry` Rust crate for manual span creation:

```rust
let mut span = self.tracer
    .span_builder("payment.process")
    .with_kind(SpanKind::Server)
    .start(&self.tracer);
span.set_attribute(KeyValue::new("app.payment.amount_cents", amount));
```

### Spans

| Span | Kind | Description |
|------|------|-------------|
| `payment.process` | Server | Top-level payment processing |
| `payment.validate` | Internal | Input validation |
| `payment.charge` | Internal | Mock charge (UUID generation) |

### Attributes

| Attribute | Description |
|-----------|-------------|
| `app.payment.amount_cents` | Amount in USD cents |
| `app.payment.transaction_id` | Generated UUID |
| `app.payment.card_last_four` | Last 4 digits of card |

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `app.payment.processed.total` | Counter | Payments processed |
| `app.payment.amount.sum` | Counter | Total USD cents |

## Validation

Returns `INVALID_ARGUMENT` for:

- Amount <= 0 or missing
- Missing or empty credit card number

## Key Files

| File | What to Study |
|------|--------------|
| `src/main.rs` | All logic, OTel setup, spans, metrics, tests |
| `build.rs` | Proto compilation via `tonic-build` |
| `Cargo.toml` | Rust OTel dependencies |
