package io.opentelemetry.demo.cart;

/**
 * Simple POJO for cart item storage.
 * No OTel imports — pure data class.
 */
public class CartItemEntry {
    private String productId;
    private int quantity;

    public CartItemEntry() {}

    public CartItemEntry(String productId, int quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
