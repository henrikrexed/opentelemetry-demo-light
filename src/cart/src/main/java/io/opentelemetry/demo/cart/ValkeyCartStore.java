package io.opentelemetry.demo.cart;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Valkey/Redis-backed cart store using Jedis.
 *
 * No OTel imports — the Java agent auto-instruments Jedis calls, generating
 * Redis client spans for every GET/SET/DEL operation.
 */
public class ValkeyCartStore implements CartStore {
    private static final Logger logger = Logger.getLogger(ValkeyCartStore.class.getName());
    private static final String KEY_PREFIX = "cart:";
    private static final Gson gson = new Gson();
    private static final Type CART_LIST_TYPE = new TypeToken<List<CartItemEntry>>() {}.getType();

    private final JedisPool pool;
    private final int ttlSeconds;

    public ValkeyCartStore(String address, int ttlSeconds) {
        String[] parts = address.split(":");
        String host = parts[0];
        int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 6379;

        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(5);
        poolConfig.setMaxIdle(2);

        this.pool = new JedisPool(poolConfig, host, port);
        this.ttlSeconds = ttlSeconds;
        logger.info("Connected to Valkey at " + address + " (TTL=" + ttlSeconds + "s)");
    }

    @Override
    public void addItem(String userId, String productId, int quantity) {
        String key = KEY_PREFIX + userId;
        try (var jedis = pool.getResource()) {
            List<CartItemEntry> items = getCartInternal(jedis, key);

            boolean found = false;
            for (CartItemEntry item : items) {
                if (item.getProductId().equals(productId)) {
                    item.setQuantity(item.getQuantity() + quantity);
                    found = true;
                    break;
                }
            }
            if (!found) {
                items.add(new CartItemEntry(productId, quantity));
            }

            jedis.setex(key, ttlSeconds, gson.toJson(items));
        }
    }

    @Override
    public List<CartItemEntry> getCart(String userId) {
        String key = KEY_PREFIX + userId;
        try (var jedis = pool.getResource()) {
            return getCartInternal(jedis, key);
        }
    }

    @Override
    public void emptyCart(String userId) {
        String key = KEY_PREFIX + userId;
        try (var jedis = pool.getResource()) {
            jedis.del(key);
        }
    }

    @Override
    public void close() {
        pool.close();
    }

    private List<CartItemEntry> getCartInternal(redis.clients.jedis.Jedis jedis, String key) {
        String json = jedis.get(key);
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            List<CartItemEntry> items = gson.fromJson(json, CART_LIST_TYPE);
            return items != null ? new ArrayList<>(items) : new ArrayList<>();
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to parse cart JSON, returning empty cart", e);
            return new ArrayList<>();
        }
    }
}
