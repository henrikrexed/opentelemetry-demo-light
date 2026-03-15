"""Checkout service — order orchestrator.

Calls Cart, Product Catalog, and Payment services via gRPC.
Uses OpenTelemetry auto + manual instrumentation (hybrid approach).
"""

import logging
import os
import uuid
from concurrent import futures

import grpc
import psycopg2
from grpc_health.v1 import health, health_pb2, health_pb2_grpc

from opentelemetry import trace
from opentelemetry.trace import StatusCode

import demo_pb2
import demo_pb2_grpc

logger = logging.getLogger("checkout")
tracer = trace.get_tracer("checkout")

SHIPPING_BASE_CENTS = 599    # $5.99
SHIPPING_PER_ITEM_CENTS = 199  # $1.99 per item


class CheckoutServicer(demo_pb2_grpc.CheckoutServiceServicer):
    """Implements the CheckoutService gRPC interface."""

    def __init__(self):
        self.cart_addr = os.environ.get("CART_ADDR", "localhost:7070")
        self.catalog_addr = os.environ.get("PRODUCT_CATALOG_ADDR", "localhost:3550")
        self.payment_addr = os.environ.get("PAYMENT_ADDR", "localhost:6060")
        self.db_conn = self._connect_db()

    def _connect_db(self):
        return psycopg2.connect(
            host=os.environ.get("POSTGRES_HOST", "localhost"),
            port=os.environ.get("POSTGRES_PORT", "5432"),
            user=os.environ.get("POSTGRES_USER", "otel"),
            password=os.environ.get("POSTGRES_PASSWORD", "otel"),
            dbname=os.environ.get("POSTGRES_DB", "checkout_orders"),
        )

    def PlaceOrder(self, request, context):
        with tracer.start_as_current_span("checkout.place_order") as span:
            user_id = request.user_id
            span.set_attribute("app.user.id", user_id)

            try:
                # 1. Get cart
                cart_items = self._get_cart(user_id)
                if not cart_items:
                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details("Cart is empty")
                    return demo_pb2.PlaceOrderResponse()

                # 2. Get product details and calculate total
                order_items, total_cents = self._calculate_total(cart_items)
                span.set_attribute("app.order.items.count", len(order_items))
                span.set_attribute("app.order.total", total_cents)

                # 3. Process payment
                transaction_id = self._process_payment(
                    total_cents, request.credit_card
                )
                span.set_attribute("app.payment.transaction_id", transaction_id)

                # 4. Calculate shipping
                shipping_cents = self._calculate_shipping(len(cart_items))

                # 5. Store order
                order_id = str(uuid.uuid4())
                span.set_attribute("app.order.id", order_id)
                self._store_order(
                    order_id, user_id, order_items, total_cents,
                    shipping_cents, transaction_id,
                    request.user_email, request.address,
                )

                # 6. Empty cart
                self._empty_cart(user_id)

                # 7. Log confirmation
                self._log_confirmation(order_id, total_cents, len(order_items))

                span.set_status(StatusCode.OK)

                return demo_pb2.PlaceOrderResponse(
                    order_id=order_id,
                    shipping_tracking_id="",
                    shipping_cost=demo_pb2.Money(amount_cents=shipping_cents),
                    total_cost=demo_pb2.Money(amount_cents=total_cents),
                    items=[
                        demo_pb2.OrderItem(
                            item=demo_pb2.CartItem(
                                product_id=oi["product_id"],
                                quantity=oi["quantity"],
                            ),
                            cost=demo_pb2.Money(amount_cents=oi["cost_cents"]),
                        )
                        for oi in order_items
                    ],
                    transaction_id=transaction_id,
                )

            except Exception as e:
                span.set_status(StatusCode.ERROR, str(e))
                span.record_exception(e)
                logger.error("PlaceOrder failed: %s", e)
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(str(e))
                return demo_pb2.PlaceOrderResponse()

    def _get_cart(self, user_id):
        """Get cart items from the Cart service."""
        with grpc.insecure_channel(self.cart_addr) as channel:
            stub = demo_pb2_grpc.CartServiceStub(channel)
            cart = stub.GetCart(demo_pb2.GetCartRequest(user_id=user_id))
            return list(cart.items)

    def _calculate_total(self, cart_items):
        """Look up product prices and calculate order total."""
        with tracer.start_as_current_span("checkout.calculate_total") as span:
            order_items = []
            total_cents = 0

            with grpc.insecure_channel(self.catalog_addr) as channel:
                stub = demo_pb2_grpc.ProductCatalogServiceStub(channel)
                for item in cart_items:
                    product = stub.GetProduct(
                        demo_pb2.GetProductRequest(id=item.product_id)
                    )
                    item_cost = product.price_usd.amount_cents * item.quantity
                    total_cents += item_cost
                    order_items.append({
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "cost_cents": item_cost,
                    })

            span.set_attribute("app.order.total", total_cents)
            span.set_attribute("app.order.items.count", len(order_items))
            return order_items, total_cents

    def _process_payment(self, amount_cents, credit_card):
        """Call the Payment service to process payment."""
        with grpc.insecure_channel(self.payment_addr) as channel:
            stub = demo_pb2_grpc.PaymentServiceStub(channel)
            resp = stub.ProcessPayment(
                demo_pb2.ProcessPaymentRequest(
                    amount=demo_pb2.Money(amount_cents=amount_cents),
                    credit_card=credit_card,
                )
            )
            logger.info("Payment processed: transaction_id=%s", resp.transaction_id)
            return resp.transaction_id

    def _calculate_shipping(self, item_count):
        """Flat-rate shipping calculation."""
        with tracer.start_as_current_span("checkout.shipping_calc") as span:
            cost = SHIPPING_BASE_CENTS + (SHIPPING_PER_ITEM_CENTS * item_count)
            span.set_attribute("app.shipping.cost_cents", cost)
            span.set_attribute("app.shipping.item_count", item_count)
            return cost

    def _store_order(self, order_id, user_id, order_items, total_cents,
                     shipping_cents, transaction_id, email, address):
        """Store order in PostgreSQL."""
        import json
        items_json = json.dumps(order_items)
        address_json = json.dumps({
            "street_address": address.street_address if address else "",
            "city": address.city if address else "",
            "state": address.state if address else "",
            "zip_code": address.zip_code if address else "",
            "country": address.country if address else "",
        })

        cur = self.db_conn.cursor()
        cur.execute(
            """INSERT INTO orders (id, user_id, items, total_usd_cents,
               shipping_usd_cents, transaction_id, email, address)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (order_id, user_id, items_json, total_cents,
             shipping_cents, transaction_id, email, address_json),
        )
        self.db_conn.commit()
        cur.close()

    def _empty_cart(self, user_id):
        """Empty the user's cart after order is placed."""
        with grpc.insecure_channel(self.cart_addr) as channel:
            stub = demo_pb2_grpc.CartServiceStub(channel)
            stub.EmptyCart(demo_pb2.EmptyCartRequest(user_id=user_id))
            logger.info("Cart emptied for user %s", user_id)

    def _log_confirmation(self, order_id, total_cents, item_count):
        """Log order confirmation (mock email)."""
        with tracer.start_as_current_span("checkout.send_confirmation") as span:
            span.set_attribute("app.order.id", order_id)
            logger.info(
                "Order placed: order_id=%s total_cents=%d items=%d",
                order_id, total_cents, item_count,
            )


def serve():
    port = os.environ.get("PORT", "5050")

    # Configure structured logging with trace correlation
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] "
               "[trace_id=%(otelTraceID)s span_id=%(otelSpanID)s] "
               "%(message)s",
    )

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    demo_pb2_grpc.add_CheckoutServiceServicer_to_server(
        CheckoutServicer(), server
    )

    # Health check
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)

    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info("Checkout service listening on port %s", port)
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
