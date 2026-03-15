package io.opentelemetry.demo.cart;

import io.grpc.stub.StreamObserver;
import io.opentelemetry.demo.AddItemRequest;
import io.opentelemetry.demo.Cart;
import io.opentelemetry.demo.CartItem;
import io.opentelemetry.demo.Empty;
import io.opentelemetry.demo.EmptyCartRequest;
import io.opentelemetry.demo.GetCartRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CartService using an in-memory CartStore.
 */
class CartServiceTest {

    private InMemoryCartStore store;
    private CartService service;

    @BeforeEach
    void setUp() {
        store = new InMemoryCartStore();
        service = new CartService(store);
    }

    @Test
    void addItem_newItem() {
        AddItemRequest request = AddItemRequest.newBuilder()
                .setUserId("user1")
                .setItem(CartItem.newBuilder()
                        .setProductId("PROD1")
                        .setQuantity(2)
                        .build())
                .build();

        Empty response = callUnary(request, service::addItem);
        assertNotNull(response);

        List<CartItemEntry> cart = store.getCart("user1");
        assertEquals(1, cart.size());
        assertEquals("PROD1", cart.get(0).getProductId());
        assertEquals(2, cart.get(0).getQuantity());
    }

    @Test
    void addItem_incrementsExistingQuantity() {
        store.addItem("user1", "PROD1", 2);

        AddItemRequest request = AddItemRequest.newBuilder()
                .setUserId("user1")
                .setItem(CartItem.newBuilder()
                        .setProductId("PROD1")
                        .setQuantity(3)
                        .build())
                .build();

        callUnary(request, service::addItem);

        List<CartItemEntry> cart = store.getCart("user1");
        assertEquals(1, cart.size());
        assertEquals(5, cart.get(0).getQuantity());
    }

    @Test
    void getCart_empty() {
        GetCartRequest request = GetCartRequest.newBuilder()
                .setUserId("user1")
                .build();

        Cart cart = callUnary(request, service::getCart);
        assertEquals("user1", cart.getUserId());
        assertEquals(0, cart.getItemsCount());
    }

    @Test
    void getCart_withItems() {
        store.addItem("user1", "PROD1", 2);
        store.addItem("user1", "PROD2", 1);

        GetCartRequest request = GetCartRequest.newBuilder()
                .setUserId("user1")
                .build();

        Cart cart = callUnary(request, service::getCart);
        assertEquals("user1", cart.getUserId());
        assertEquals(2, cart.getItemsCount());
        assertEquals("PROD1", cart.getItems(0).getProductId());
        assertEquals(2, cart.getItems(0).getQuantity());
        assertEquals("PROD2", cart.getItems(1).getProductId());
        assertEquals(1, cart.getItems(1).getQuantity());
    }

    @Test
    void emptyCart() {
        store.addItem("user1", "PROD1", 2);
        store.addItem("user1", "PROD2", 1);

        EmptyCartRequest request = EmptyCartRequest.newBuilder()
                .setUserId("user1")
                .build();

        callUnary(request, service::emptyCart);

        List<CartItemEntry> cart = store.getCart("user1");
        assertTrue(cart.isEmpty());
    }

    @Test
    void separateUserCarts() {
        store.addItem("user1", "PROD1", 1);
        store.addItem("user2", "PROD2", 3);

        List<CartItemEntry> cart1 = store.getCart("user1");
        List<CartItemEntry> cart2 = store.getCart("user2");

        assertEquals(1, cart1.size());
        assertEquals("PROD1", cart1.get(0).getProductId());
        assertEquals(1, cart2.size());
        assertEquals("PROD2", cart2.get(0).getProductId());
    }

    // --- Helper ---

    @FunctionalInterface
    interface GrpcCall<Req, Resp> {
        void call(Req request, StreamObserver<Resp> observer);
    }

    private <Req, Resp> Resp callUnary(Req request, GrpcCall<Req, Resp> method) {
        AtomicReference<Resp> result = new AtomicReference<>();
        AtomicReference<Throwable> error = new AtomicReference<>();

        method.call(request, new StreamObserver<>() {
            @Override
            public void onNext(Resp value) { result.set(value); }
            @Override
            public void onError(Throwable t) { error.set(t); }
            @Override
            public void onCompleted() {}
        });

        if (error.get() != null) {
            fail("gRPC call failed: " + error.get().getMessage());
        }
        return result.get();
    }

    /**
     * In-memory CartStore for unit testing (no Valkey dependency).
     */
    static class InMemoryCartStore implements CartStore {
        private final java.util.Map<String, List<CartItemEntry>> carts = new java.util.HashMap<>();

        @Override
        public void addItem(String userId, String productId, int quantity) {
            List<CartItemEntry> items = carts.computeIfAbsent(userId, k -> new ArrayList<>());
            for (CartItemEntry item : items) {
                if (item.getProductId().equals(productId)) {
                    item.setQuantity(item.getQuantity() + quantity);
                    return;
                }
            }
            items.add(new CartItemEntry(productId, quantity));
        }

        @Override
        public List<CartItemEntry> getCart(String userId) {
            return new ArrayList<>(carts.getOrDefault(userId, List.of()));
        }

        @Override
        public void emptyCart(String userId) {
            carts.remove(userId);
        }

        @Override
        public void close() {}
    }
}
