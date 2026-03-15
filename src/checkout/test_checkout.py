"""Unit tests for the Checkout service.

Tests the business logic without requiring real gRPC connections
or PostgreSQL by mocking external dependencies.
"""

import unittest
from unittest.mock import MagicMock, patch, PropertyMock

import demo_pb2
from checkout_service import (
    CheckoutServicer,
    SHIPPING_BASE_CENTS,
    SHIPPING_PER_ITEM_CENTS,
)


class TestShippingCalculation(unittest.TestCase):
    """Test flat-rate shipping calculation."""

    def setUp(self):
        # Create servicer without DB connection
        with patch.object(CheckoutServicer, '_connect_db', return_value=MagicMock()):
            self.servicer = CheckoutServicer()

    def test_shipping_one_item(self):
        cost = self.servicer._calculate_shipping(1)
        self.assertEqual(cost, SHIPPING_BASE_CENTS + SHIPPING_PER_ITEM_CENTS)
        # $5.99 + $1.99 = $7.98 = 798 cents
        self.assertEqual(cost, 798)

    def test_shipping_three_items(self):
        cost = self.servicer._calculate_shipping(3)
        self.assertEqual(cost, SHIPPING_BASE_CENTS + 3 * SHIPPING_PER_ITEM_CENTS)
        # $5.99 + 3 * $1.99 = $11.96 = 1196 cents
        self.assertEqual(cost, 1196)

    def test_shipping_zero_items(self):
        cost = self.servicer._calculate_shipping(0)
        self.assertEqual(cost, SHIPPING_BASE_CENTS)
        self.assertEqual(cost, 599)


class TestCalculateTotal(unittest.TestCase):
    """Test order total calculation."""

    def setUp(self):
        with patch.object(CheckoutServicer, '_connect_db', return_value=MagicMock()):
            self.servicer = CheckoutServicer()

    @patch('grpc.insecure_channel')
    def test_calculate_total_single_item(self, mock_channel):
        # Mock the product catalog stub
        mock_stub = MagicMock()
        mock_stub.GetProduct.return_value = demo_pb2.Product(
            id="PROD1",
            name="Test Product",
            price_usd=demo_pb2.Money(amount_cents=9999),
        )
        mock_channel.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_channel.return_value.__exit__ = MagicMock(return_value=False)

        with patch('demo_pb2_grpc.ProductCatalogServiceStub', return_value=mock_stub):
            cart_items = [demo_pb2.CartItem(product_id="PROD1", quantity=2)]
            order_items, total = self.servicer._calculate_total(cart_items)

        self.assertEqual(total, 19998)  # 9999 * 2
        self.assertEqual(len(order_items), 1)
        self.assertEqual(order_items[0]["product_id"], "PROD1")
        self.assertEqual(order_items[0]["quantity"], 2)
        self.assertEqual(order_items[0]["cost_cents"], 19998)

    @patch('grpc.insecure_channel')
    def test_calculate_total_multiple_items(self, mock_channel):
        mock_stub = MagicMock()
        mock_stub.GetProduct.side_effect = [
            demo_pb2.Product(id="P1", price_usd=demo_pb2.Money(amount_cents=1000)),
            demo_pb2.Product(id="P2", price_usd=demo_pb2.Money(amount_cents=2000)),
        ]
        mock_channel.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_channel.return_value.__exit__ = MagicMock(return_value=False)

        with patch('demo_pb2_grpc.ProductCatalogServiceStub', return_value=mock_stub):
            cart_items = [
                demo_pb2.CartItem(product_id="P1", quantity=1),
                demo_pb2.CartItem(product_id="P2", quantity=3),
            ]
            order_items, total = self.servicer._calculate_total(cart_items)

        self.assertEqual(total, 7000)  # 1000*1 + 2000*3
        self.assertEqual(len(order_items), 2)


class TestPlaceOrderValidation(unittest.TestCase):
    """Test PlaceOrder edge cases."""

    def setUp(self):
        with patch.object(CheckoutServicer, '_connect_db', return_value=MagicMock()):
            self.servicer = CheckoutServicer()

    @patch.object(CheckoutServicer, '_get_cart', return_value=[])
    def test_empty_cart_returns_error(self, mock_get_cart):
        context = MagicMock()
        request = demo_pb2.PlaceOrderRequest(user_id="user1")
        self.servicer.PlaceOrder(request, context)
        context.set_code.assert_called_with(
            unittest.mock.ANY  # grpc.StatusCode.FAILED_PRECONDITION
        )


if __name__ == "__main__":
    unittest.main()
