/**
 * gRPC client for backend services.
 * Uses @grpc/proto-loader for dynamic proto loading (no compilation step).
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'demo.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).oteldemo;

const CATALOG_ADDR = process.env.PRODUCT_CATALOG_ADDR || 'localhost:3550';
const CART_ADDR = process.env.CART_ADDR || 'localhost:7070';
const CHECKOUT_ADDR = process.env.CHECKOUT_ADDR || 'localhost:5050';

function createClient(ServiceClass, address) {
  return new ServiceClass(address, grpc.credentials.createInsecure());
}

const catalogClient = createClient(proto.ProductCatalogService, CATALOG_ADDR);
const cartClient = createClient(proto.CartService, CART_ADDR);
const checkoutClient = createClient(proto.CheckoutService, CHECKOUT_ADDR);

function promisify(client, method) {
  return (...args) =>
    new Promise((resolve, reject) => {
      client[method](...args, (err, response) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
}

module.exports = {
  listProducts: promisify(catalogClient, 'listProducts'),
  getProduct: promisify(catalogClient, 'getProduct'),
  searchProducts: promisify(catalogClient, 'searchProducts'),
  addItem: promisify(cartClient, 'addItem'),
  getCart: promisify(cartClient, 'getCart'),
  emptyCart: promisify(cartClient, 'emptyCart'),
  placeOrder: promisify(checkoutClient, 'placeOrder'),
};
