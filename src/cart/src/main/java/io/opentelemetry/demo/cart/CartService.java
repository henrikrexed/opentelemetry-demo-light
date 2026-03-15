package io.opentelemetry.demo.cart;

import io.grpc.stub.StreamObserver;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.demo.AddItemRequest;
import io.opentelemetry.demo.Cart;
import io.opentelemetry.demo.CartItem;
import io.opentelemetry.demo.CartServiceGrpc;
import io.opentelemetry.demo.Empty;
import io.opentelemetry.demo.EmptyCartRequest;
import io.opentelemetry.demo.GetCartRequest;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;

/**
 * gRPC CartService implementation.
 *
 * Business logic has NO manual OTel span or trace imports — the Java agent
 * handles all gRPC server span creation, context propagation, and Jedis
 * instrumentation automatically.
 *
 * The only OTel API usage is for custom business metrics (Story 3.4),
 * which the Java agent cannot auto-generate since they are domain-specific.
 */
public class CartService extends CartServiceGrpc.CartServiceImplBase {
    private static final Logger logger = Logger.getLogger(CartService.class.getName());

    private final CartStore store;
    private final LongCounter addCounter;
    private final AtomicLong lastCartItemCount = new AtomicLong(0);

    public CartService(CartStore store) {
        this.store = store;

        // Custom business metrics — the only OTel API usage in the cart service
        Meter meter = GlobalOpenTelemetry.getMeter("cart");
        this.addCounter = meter.counterBuilder("app.cart.add.total")
                .setDescription("Total number of add-to-cart operations")
                .build();

        // Observable gauge reports the last-seen cart item count
        meter.gaugeBuilder("app.cart.items.count")
                .setDescription("Number of items in a user's cart")
                .ofLongs()
                .buildWithCallback(measurement ->
                        measurement.record(lastCartItemCount.get()));
    }

    @Override
    public void addItem(AddItemRequest request, StreamObserver<Empty> responseObserver) {
        String userId = request.getUserId();
        CartItem item = request.getItem();

        store.addItem(userId, item.getProductId(), item.getQuantity());
        addCounter.add(1);

        // Update gauge with current cart size
        List<CartItemEntry> cart = store.getCart(userId);
        int totalItems = cart.stream().mapToInt(CartItemEntry::getQuantity).sum();
        lastCartItemCount.set(totalItems);

        logger.info("Added item " + item.getProductId() + " (qty=" + item.getQuantity() + ") to cart for user " + userId);
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }

    @Override
    public void getCart(GetCartRequest request, StreamObserver<Cart> responseObserver) {
        String userId = request.getUserId();
        List<CartItemEntry> items = store.getCart(userId);

        Cart.Builder cartBuilder = Cart.newBuilder().setUserId(userId);
        for (CartItemEntry entry : items) {
            cartBuilder.addItems(CartItem.newBuilder()
                    .setProductId(entry.getProductId())
                    .setQuantity(entry.getQuantity())
                    .build());
        }

        responseObserver.onNext(cartBuilder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void emptyCart(EmptyCartRequest request, StreamObserver<Empty> responseObserver) {
        String userId = request.getUserId();
        store.emptyCart(userId);
        lastCartItemCount.set(0);

        logger.info("Emptied cart for user " + userId);
        responseObserver.onNext(Empty.getDefaultInstance());
        responseObserver.onCompleted();
    }
}
