"""Load generator for OpenTelemetry Demo Light.

Simulates user journeys: browse products → view detail → add to cart → checkout.
Exercises all 5 application services and both datastores.
"""

import random
import logging

from locust import HttpUser, task, between

logger = logging.getLogger(__name__)

# Product IDs from the seed data
PRODUCT_IDS = [
    "OLJCESPC7Z",
    "66VCHSJNUP",
    "1YMWWN1N4O",
    "L9ECAV7KIM",
    "2ZYFJ3GM2N",
    "0PUK6V6EV0",
    "LS4PSXUNUM",
    "9SIQT8TOJO",
    "6E92ZMYYFZ",
    "HQTGWGPNH4",
]


class StorefrontUser(HttpUser):
    """Simulates a user browsing the storefront, adding items, and checking out."""

    wait_time = between(1, 5)

    @task(5)
    def browse_products(self):
        """Browse the product listing page."""
        self.client.get("/api/products", name="/api/products")

    @task(3)
    def view_product(self):
        """View a random product detail page."""
        product_id = random.choice(PRODUCT_IDS)
        self.client.get(
            f"/api/product/{product_id}",
            name="/api/product/[id]",
        )

    @task(2)
    def add_to_cart(self):
        """Add a random product to the cart."""
        product_id = random.choice(PRODUCT_IDS)
        quantity = random.randint(1, 3)
        self.client.post(
            "/api/cart/add",
            json={"productId": product_id, "quantity": quantity},
            name="/api/cart/add",
        )

    @task(1)
    def view_cart(self):
        """View the cart page."""
        self.client.get("/api/cart", name="/api/cart")

    @task(1)
    def checkout(self):
        """Complete the checkout flow."""
        # First add an item to ensure the cart isn't empty
        product_id = random.choice(PRODUCT_IDS)
        self.client.post(
            "/api/cart/add",
            json={"productId": product_id, "quantity": 1},
            name="/api/cart/add",
        )

        # Then place the order
        self.client.post(
            "/api/checkout",
            json={
                "email": f"user{random.randint(1, 100)}@example.com",
                "streetAddress": "123 Demo Street",
                "city": "Springfield",
                "state": "IL",
                "zipCode": "62704",
                "country": "US",
                "creditCardNumber": "4111111111111111",
                "creditCardCvv": "123",
                "creditCardExpirationYear": "2030",
                "creditCardExpirationMonth": "12",
            },
            name="/api/checkout",
        )
