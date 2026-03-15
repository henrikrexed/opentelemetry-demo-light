-- Checkout orders schema.
-- Runs against the checkout_orders database.

\connect checkout_orders;

CREATE TABLE IF NOT EXISTS orders (
    id                  VARCHAR(36)     PRIMARY KEY,
    user_id             VARCHAR(255)    NOT NULL,
    items               JSONB           NOT NULL DEFAULT '[]',
    total_usd_cents     INTEGER         NOT NULL DEFAULT 0,
    shipping_usd_cents  INTEGER         NOT NULL DEFAULT 0,
    transaction_id      VARCHAR(255)    NOT NULL DEFAULT '',
    email               VARCHAR(255)    NOT NULL DEFAULT '',
    address             JSONB           NOT NULL DEFAULT '{}',
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
