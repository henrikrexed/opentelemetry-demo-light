package io.opentelemetry.demo.cart;

import java.util.List;

/**
 * Interface for cart persistence.
 * No OTel imports — instrumentation is handled by the Java agent.
 */
public interface CartStore {
    void addItem(String userId, String productId, int quantity);
    List<CartItemEntry> getCart(String userId);
    void emptyCart(String userId);
    void close();
}
