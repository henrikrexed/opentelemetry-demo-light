/**
 * k6 load test for OpenTelemetry Demo Light.
 *
 * Simulates user journeys: browse products → view detail → add to cart → checkout.
 * Exercises all 5 application services and both datastores.
 *
 * Telemetry is exported via xk6-output-opentelemetry to the OTel Collector,
 * so k6 metrics appear alongside application metrics in your backend.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { randomItem, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// Product IDs from the seed data
const PRODUCT_IDS = [
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
];

const BASE_URL = __ENV.FRONTEND_URL || "http://frontend:8080";

export const options = {
  vus: parseInt(__ENV.K6_VUS || "5"),
  duration: __ENV.K6_DURATION || "0", // 0 = run forever
  iterations: __ENV.K6_ITERATIONS ? parseInt(__ENV.K6_ITERATIONS) : undefined,
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.1"],
  },
};

// If duration is "0" (run forever), override to use stages-like continuous load
if (options.duration === "0") {
  delete options.duration;
  delete options.iterations;
  options.scenarios = {
    continuous: {
      executor: "constant-vus",
      vus: parseInt(__ENV.K6_VUS || "5"),
      duration: "24h",
      gracefulStop: "5s",
    },
  };
}

export default function () {
  // --- Browse products (most common action) ---
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    "GET /api/products status 200": (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 3));

  // --- View a random product ---
  const productId = randomItem(PRODUCT_IDS);
  const productRes = http.get(`${BASE_URL}/api/product/${productId}`);
  check(productRes, {
    "GET /api/product/:id status 200": (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 2));

  // --- Add to cart ---
  const addRes = http.post(
    `${BASE_URL}/api/cart/add`,
    JSON.stringify({
      productId: productId,
      quantity: randomIntBetween(1, 3),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(addRes, {
    "POST /api/cart/add status 200": (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 2));

  // --- View cart ---
  const cartRes = http.get(`${BASE_URL}/api/cart`);
  check(cartRes, {
    "GET /api/cart status 200": (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 2));

  // --- Checkout (less frequent — roughly 1 in 3 iterations) ---
  if (Math.random() < 0.33) {
    const checkoutRes = http.post(
      `${BASE_URL}/api/checkout`,
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
    check(checkoutRes, {
      "POST /api/checkout status 200": (r) => r.status === 200,
    });
  }

  sleep(randomIntBetween(1, 3));
}
