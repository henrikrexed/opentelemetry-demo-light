/**
 * k6 load test for OpenTelemetry Demo Light.
 *
 * Uses the xk6-output-opentelemetry helper API (otel.step, otel.request,
 * otel.check) for automatic span creation, baggage injection, and check
 * correlation. Telemetry is exported via OTLP to the OTel Collector.
 */

import http from "k6/http";
import { sleep } from "k6";
import otel from "k6/x/otel";
import { randomItem, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const PRODUCT_IDS = [
  "OLJCESPC7Z", "66VCHSJNUP", "1YMWWN1N4O", "L9ECAV7KIM", "2ZYFJ3GM2N",
  "0PUK6V6EV0", "LS4PSXUNUM", "9SIQT8TOJO", "6E92ZMYYFZ", "HQTGWGPNH4",
];

const BASE_URL = __ENV.FRONTEND_URL || "http://frontend:8080";

export const options = {
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.1"],
  },
};

// Continuous load: run forever with configured VU count
const vus = parseInt(__ENV.K6_VUS || "5");
const duration = __ENV.K6_DURATION || "0";
if (duration === "0") {
  options.scenarios = {
    continuous: {
      executor: "constant-vus",
      vus: vus,
      duration: "24h",
      gracefulStop: "5s",
    },
  };
} else {
  options.vus = vus;
  options.duration = duration;
}

export default function () {
  // Set scenario-level baggage visible to all downstream services
  otel.setBaggage("test.scenario", "browse-and-buy");
  otel.setAttribute("test.type", "load");

  // --- Browse Products ---
  otel.step("Browse Products", function () {
    const products = otel.request("list-products", "GET", `${BASE_URL}/api/products`);
    otel.check("products-loaded", products, {
      "status is 200": (r) => r.status === 200,
    });
  });
  sleep(randomIntBetween(1, 3));

  // --- View Product Detail ---
  const productId = randomItem(PRODUCT_IDS);
  otel.step("View Product", function () {
    otel.setBaggage("product.id", productId);
    const product = otel.request("get-product", "GET", `${BASE_URL}/api/product/${productId}`);
    otel.check("product-found", product, {
      "status is 200": (r) => r.status === 200,
    });
  });
  sleep(randomIntBetween(1, 2));

  // --- Add to Cart ---
  otel.step("Add to Cart", function () {
    otel.setBaggage("cart.action", "add");
    otel.setAttribute("business.flow", "cart");
    otel.request("add-to-cart", "POST", `${BASE_URL}/api/cart/add`,
      JSON.stringify({ productId: productId, quantity: randomIntBetween(1, 3) }),
      { headers: { "Content-Type": "application/json" } }
    );
  });
  sleep(randomIntBetween(1, 2));

  // --- View Cart ---
  otel.step("View Cart", function () {
    const cart = otel.request("view-cart", "GET", `${BASE_URL}/api/cart`);
    otel.check("cart-loaded", cart, {
      "status is 200": (r) => r.status === 200,
    });
  });
  sleep(randomIntBetween(1, 2));

  // --- Checkout (33% of iterations) ---
  if (Math.random() < 0.33) {
    otel.step("Checkout", function () {
      otel.setAttribute("business.flow", "purchase");
      otel.setBaggage("checkout.initiated", "true");
      const order = otel.request("place-order", "POST", `${BASE_URL}/api/checkout`,
        JSON.stringify({
          email: `user${randomIntBetween(1, 100)}@example.com`,
          streetAddress: "123 Demo Street",
          city: "Springfield",
          state: "IL",
          zipCode: "62704",
          country: "US",
          creditCardNumber: "4111111111111111",
          creditCardCvv: "123",
          creditCardExpirationYear: "2030",
          creditCardExpirationMonth: "12",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
      otel.check("order-placed", order, {
        "status is 200": (r) => r.status === 200,
      });
    });
  }

  sleep(randomIntBetween(1, 3));
}
