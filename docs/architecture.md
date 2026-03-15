# Architecture

## Service Graph

```mermaid
graph TB
    Browser["Browser<br/>(OTel Web SDK)"]
    Frontend["Frontend<br/>Node.js / Next.js<br/>:8080"]
    PC["Product Catalog<br/>Go<br/>:3550"]
    Cart["Cart<br/>Java<br/>:7070"]
    CO["Checkout<br/>Python<br/>:5050"]
    Pay["Payment<br/>Rust<br/>:6060"]
    PG["PostgreSQL"]
    VK["Valkey"]
    Collector["OTel Collector<br/>:4317 / :4318"]
    Backend["Your Backend<br/>(Jaeger, Grafana, etc.)"]
    LG["Load Generator<br/>Locust :8089"]

    Browser -->|HTTP| Frontend
    Frontend -->|gRPC| PC
    Frontend -->|gRPC| Cart
    Frontend -->|gRPC| CO

    CO -->|gRPC| Cart
    CO -->|gRPC| PC
    CO -->|gRPC| Pay

    PC -->|SQL| PG
    CO -->|SQL| PG
    Cart -->|Redis protocol| VK

    Frontend -.->|OTLP| Collector
    PC -.->|OTLP| Collector
    Cart -.->|OTLP| Collector
    CO -.->|OTLP| Collector
    Pay -.->|OTLP| Collector
    Collector -.->|OTLP| Backend

    LG -->|HTTP| Frontend

    style Frontend fill:#4a90d9
    style PC fill:#00b894
    style Cart fill:#e17055
    style CO fill:#fdcb6e
    style Pay fill:#a29bfe
    style Collector fill:#636e72,color:#fff
```

## Checkout Request Flow

A single checkout request produces a distributed trace across all 5 services:

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant CO as Checkout
    participant C as Cart
    participant PC as Product Catalog
    participant P as Payment
    participant PG as PostgreSQL
    participant V as Valkey

    B->>F: POST /api/checkout
    F->>CO: gRPC PlaceOrder

    CO->>C: gRPC GetCart
    C->>V: GET cart:{userId}
    V-->>C: cart items
    C-->>CO: Cart

    loop For each cart item
        CO->>PC: gRPC GetProduct
        PC->>PG: SELECT product
        PG-->>PC: product row
        PC-->>CO: Product
    end

    CO->>CO: Calculate total (USD)
    CO->>P: gRPC ProcessPayment
    P-->>CO: transaction_id

    CO->>CO: Calculate shipping (flat rate)
    CO->>PG: INSERT order
    PG-->>CO: ok

    CO->>C: gRPC EmptyCart
    C->>V: DEL cart:{userId}
    V-->>C: ok
    C-->>CO: ok

    CO-->>F: PlaceOrderResponse
    F-->>B: Order confirmation
```

## OTel Telemetry Pipeline

```mermaid
flowchart LR
    subgraph Services
        S1[Frontend]
        S2[Product Catalog]
        S3[Cart]
        S4[Checkout]
        S5[Payment]
    end

    subgraph Collector["OTel Collector"]
        R[OTLP Receiver<br/>gRPC :4317<br/>HTTP :4318]
        P1[memory_limiter]
        P2[resource<br/>service.namespace]
        P3[batch]
        E[Exporter]
    end

    S1 & S2 & S3 & S4 & S5 -->|OTLP| R
    R --> P1 --> P2 --> P3 --> E

    E -->|debug| Console[Console Output]
    E -.->|otlp| Backend[Your OTLP Backend]

    style Collector fill:#636e72,color:#fff
```

## Data Architecture

```mermaid
erDiagram
    PRODUCTS {
        varchar id PK
        varchar name
        text description
        varchar picture
        int price_usd_cents
        text[] categories
    }

    ORDERS {
        varchar id PK
        varchar user_id
        jsonb items
        int total_usd_cents
        int shipping_usd_cents
        varchar transaction_id
        varchar email
        jsonb address
        timestamp created_at
    }

    CART_ENTRIES {
        string key "cart:{userId}"
        json value "[{productId, quantity}]"
        int ttl "3600s"
    }

    PRODUCTS ||--o{ ORDERS : "referenced in items"
    CART_ENTRIES ||--o{ ORDERS : "becomes order"
```

## Resource Budget

Total steady-state memory: **~1,030 MB** (470 MB headroom to 1.5 GB limit).

| Component | Memory Limit | Notes |
|-----------|-------------|-------|
| Frontend | 250 MB | Next.js SSR + Node.js heap |
| Product Catalog | 20 MB | Static Go binary, in-memory cache |
| Cart | 200 MB | JVM + `-Xmx128m` heap |
| Checkout | 50 MB | Python interpreter + grpcio |
| Payment | 10 MB | Rust static binary |
| Load Generator | 300 MB | Locust + simulated user state |
| OTel Collector | 100 MB | Batch buffering + memory limiter |
| PostgreSQL | 80 MB | Shared buffers for 2 databases |
| Valkey | 20 MB | In-memory cache, small dataset |
