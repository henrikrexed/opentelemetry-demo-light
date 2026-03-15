use std::env;

use opentelemetry::global;
use opentelemetry::metrics::Counter;
use opentelemetry::trace::{Span, SpanKind, Status, Tracer};
use opentelemetry::KeyValue;
use opentelemetry_otlp::{MetricExporter, SpanExporter, WithExportConfig};
use opentelemetry_sdk::metrics::SdkMeterProvider;
use opentelemetry_sdk::trace::TracerProvider;
use opentelemetry_sdk::Resource;
use tonic::{transport::Server, Request, Response};
use uuid::Uuid;

pub mod oteldemo {
    tonic::include_proto!("oteldemo");
}

use oteldemo::payment_service_server::{PaymentService, PaymentServiceServer};
use oteldemo::{ProcessPaymentRequest, ProcessPaymentResponse};

pub struct PaymentServiceImpl {
    tracer: opentelemetry_sdk::trace::Tracer,
    payments_counter: Counter<u64>,
    amount_counter: Counter<u64>,
}

impl PaymentServiceImpl {
    fn new(tracer: opentelemetry_sdk::trace::Tracer) -> Self {
        let meter = global::meter("payment");
        let payments_counter = meter
            .u64_counter("app.payment.processed.total")
            .with_description("Total number of payments processed")
            .build();
        let amount_counter = meter
            .u64_counter("app.payment.amount.sum")
            .with_description("Total USD cents processed")
            .build();

        Self {
            tracer,
            payments_counter,
            amount_counter,
        }
    }
}

#[tonic::async_trait]
impl PaymentService for PaymentServiceImpl {
    async fn process_payment(
        &self,
        request: Request<ProcessPaymentRequest>,
    ) -> Result<Response<ProcessPaymentResponse>, tonic::Status> {
        let req = request.into_inner();

        let mut process_span = self
            .tracer
            .span_builder("payment.process")
            .with_kind(SpanKind::Server)
            .start(&self.tracer);

        let amount_cents = req.amount.as_ref().map_or(0, |m| m.amount_cents);
        let card_number = req
            .credit_card
            .as_ref()
            .map_or("", |c| &c.credit_card_number);
        let card_last_four = if card_number.len() >= 4 {
            &card_number[card_number.len() - 4..]
        } else {
            card_number
        };

        process_span.set_attribute(KeyValue::new("app.payment.amount_cents", amount_cents));
        process_span.set_attribute(KeyValue::new(
            "app.payment.card_last_four",
            card_last_four.to_string(),
        ));

        // payment.validate span
        {
            let mut validate_span = self
                .tracer
                .span_builder("payment.validate")
                .with_kind(SpanKind::Internal)
                .start(&self.tracer);

            if amount_cents <= 0 {
                validate_span.set_status(Status::Error {
                    description: "amount must be positive".into(),
                });
                validate_span.end();
                process_span.set_status(Status::Error {
                    description: "validation failed".into(),
                });
                process_span.end();
                return Err(tonic::Status::invalid_argument(
                    "amount must be positive and non-zero",
                ));
            }

            if req.credit_card.is_none()
                || req
                    .credit_card
                    .as_ref()
                    .map_or(true, |c| c.credit_card_number.is_empty())
            {
                validate_span.set_status(Status::Error {
                    description: "credit card info required".into(),
                });
                validate_span.end();
                process_span.set_status(Status::Error {
                    description: "validation failed".into(),
                });
                process_span.end();
                return Err(tonic::Status::invalid_argument(
                    "credit card info is required",
                ));
            }

            validate_span.set_status(Status::Ok);
            validate_span.end();
        }

        // payment.charge span
        let transaction_id = {
            let mut charge_span = self
                .tracer
                .span_builder("payment.charge")
                .with_kind(SpanKind::Internal)
                .start(&self.tracer);

            let tx_id = Uuid::new_v4().to_string();
            charge_span.set_attribute(KeyValue::new(
                "app.payment.transaction_id",
                tx_id.clone(),
            ));
            charge_span.set_status(Status::Ok);
            charge_span.end();
            tx_id
        };

        process_span.set_attribute(KeyValue::new(
            "app.payment.transaction_id",
            transaction_id.clone(),
        ));
        process_span.set_status(Status::Ok);
        process_span.end();

        self.payments_counter.add(1, &[]);
        self.amount_counter.add(amount_cents as u64, &[]);

        tracing::info!(
            transaction_id = %transaction_id,
            amount_cents = amount_cents,
            "Payment processed successfully"
        );

        Ok(Response::new(ProcessPaymentResponse {
            transaction_id,
            success: true,
        }))
    }
}

fn build_resource() -> Resource {
    let service_name = env::var("OTEL_SERVICE_NAME").unwrap_or_else(|_| "payment".into());
    Resource::builder()
        .with_service_name(service_name)
        .build()
}

fn init_tracer_provider() -> TracerProvider {
    let endpoint =
        env::var("OTEL_EXPORTER_OTLP_ENDPOINT").unwrap_or_else(|_| "http://localhost:4317".into());

    let exporter = SpanExporter::builder()
        .with_tonic()
        .with_endpoint(&endpoint)
        .build()
        .expect("failed to create OTLP span exporter");

    TracerProvider::builder()
        .with_resource(build_resource())
        .with_batch_exporter(exporter)
        .build()
}

fn init_meter_provider() -> SdkMeterProvider {
    let endpoint =
        env::var("OTEL_EXPORTER_OTLP_ENDPOINT").unwrap_or_else(|_| "http://localhost:4317".into());

    let exporter = MetricExporter::builder()
        .with_tonic()
        .with_endpoint(&endpoint)
        .build()
        .expect("failed to create OTLP metric exporter");

    let reader = opentelemetry_sdk::metrics::PeriodicReader::builder(exporter)
        .build();

    SdkMeterProvider::builder()
        .with_resource(build_resource())
        .with_reader(reader)
        .build()
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let tracer_provider = init_tracer_provider();
    let tracer = tracer_provider.tracer("payment");
    global::set_tracer_provider(tracer_provider);

    let meter_provider = init_meter_provider();
    global::set_meter_provider(meter_provider);

    let port = env::var("PORT").unwrap_or_else(|_| "6060".into());
    let addr = format!("0.0.0.0:{}", port).parse()?;

    let payment_service = PaymentServiceImpl::new(tracer);

    let (mut health_reporter, health_service) = tonic_health::server::health_reporter();
    health_reporter
        .set_serving::<PaymentServiceServer<PaymentServiceImpl>>()
        .await;

    tracing::info!("Payment service listening on {}", addr);

    Server::builder()
        .add_service(health_service)
        .add_service(PaymentServiceServer::new(payment_service))
        .serve(addr)
        .await?;

    opentelemetry::global::shutdown_tracer_provider();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use oteldemo::{CreditCardInfo, Money};

    fn test_tracer() -> opentelemetry_sdk::trace::Tracer {
        let provider = TracerProvider::builder().build();
        provider.tracer("test")
    }

    fn valid_request() -> Request<ProcessPaymentRequest> {
        Request::new(ProcessPaymentRequest {
            amount: Some(Money { amount_cents: 4999 }),
            credit_card: Some(CreditCardInfo {
                credit_card_number: "4111111111111111".into(),
                credit_card_cvv: 123,
                credit_card_expiration_year: 2030,
                credit_card_expiration_month: 12,
            }),
            order_id: "order-123".into(),
        })
    }

    #[tokio::test]
    async fn test_process_payment_success() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let resp = svc.process_payment(valid_request()).await.unwrap();
        let inner = resp.into_inner();
        assert!(inner.success);
        assert!(!inner.transaction_id.is_empty());
        assert!(Uuid::parse_str(&inner.transaction_id).is_ok());
    }

    #[tokio::test]
    async fn test_process_payment_zero_amount() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let req = Request::new(ProcessPaymentRequest {
            amount: Some(Money { amount_cents: 0 }),
            credit_card: Some(CreditCardInfo {
                credit_card_number: "4111111111111111".into(),
                credit_card_cvv: 123,
                credit_card_expiration_year: 2030,
                credit_card_expiration_month: 12,
            }),
            order_id: "order-123".into(),
        });
        let err = svc.process_payment(req).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }

    #[tokio::test]
    async fn test_process_payment_negative_amount() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let req = Request::new(ProcessPaymentRequest {
            amount: Some(Money { amount_cents: -100 }),
            credit_card: Some(CreditCardInfo {
                credit_card_number: "4111111111111111".into(),
                credit_card_cvv: 123,
                credit_card_expiration_year: 2030,
                credit_card_expiration_month: 12,
            }),
            order_id: "order-123".into(),
        });
        let err = svc.process_payment(req).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }

    #[tokio::test]
    async fn test_process_payment_no_card() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let req = Request::new(ProcessPaymentRequest {
            amount: Some(Money { amount_cents: 4999 }),
            credit_card: None,
            order_id: "order-123".into(),
        });
        let err = svc.process_payment(req).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }

    #[tokio::test]
    async fn test_process_payment_empty_card_number() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let req = Request::new(ProcessPaymentRequest {
            amount: Some(Money { amount_cents: 4999 }),
            credit_card: Some(CreditCardInfo {
                credit_card_number: "".into(),
                credit_card_cvv: 123,
                credit_card_expiration_year: 2030,
                credit_card_expiration_month: 12,
            }),
            order_id: "order-123".into(),
        });
        let err = svc.process_payment(req).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }

    #[tokio::test]
    async fn test_process_payment_no_amount() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let req = Request::new(ProcessPaymentRequest {
            amount: None,
            credit_card: Some(CreditCardInfo {
                credit_card_number: "4111111111111111".into(),
                credit_card_cvv: 123,
                credit_card_expiration_year: 2030,
                credit_card_expiration_month: 12,
            }),
            order_id: "order-123".into(),
        });
        let err = svc.process_payment(req).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }

    #[tokio::test]
    async fn test_card_last_four() {
        let svc = PaymentServiceImpl::new(test_tracer());
        let resp = svc.process_payment(valid_request()).await.unwrap();
        assert!(resp.into_inner().success);
    }
}
