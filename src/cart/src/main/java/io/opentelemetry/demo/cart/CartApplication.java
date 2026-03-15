package io.opentelemetry.demo.cart;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.protobuf.services.HealthStatusManager;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Cart service application entry point.
 *
 * OTel instrumentation is handled entirely by the Java agent (-javaagent flag).
 * No manual OTel SDK setup is needed — the agent auto-instruments gRPC, Jedis,
 * and JVM metrics. Only the OTel Metrics API is used for custom business metrics.
 */
public class CartApplication {
    private static final Logger logger = Logger.getLogger(CartApplication.class.getName());
    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "7070"));

    public static void main(String[] args) throws IOException, InterruptedException {
        String valkeyAddr = System.getenv().getOrDefault("VALKEY_ADDR", "localhost:6379");
        int cartTtl = Integer.parseInt(System.getenv().getOrDefault("CART_TTL", "3600"));

        CartStore store = new ValkeyCartStore(valkeyAddr, cartTtl);
        CartService cartService = new CartService(store);
        HealthStatusManager healthManager = new HealthStatusManager();

        Server server = ServerBuilder.forPort(PORT)
                .addService(cartService)
                .addService(healthManager.getHealthService())
                .build()
                .start();

        logger.info("Cart service listening on port " + PORT);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Shutting down cart service...");
            try {
                server.shutdown().awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                logger.log(Level.WARNING, "Shutdown interrupted", e);
            }
            store.close();
        }));

        server.awaitTermination();
    }
}
