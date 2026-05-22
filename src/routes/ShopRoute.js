const express = require('express');
const app = express();

const ShopController = require('../controllers/ShopController');
const verifyToken = require('../middlewares/is_auth');
const verifyAdmin = require('../middlewares/is_admin');

app.get('/shop/products', verifyToken, ShopController.getProducts);
app.get('/shop/admin/products', verifyToken, verifyAdmin, ShopController.getAdminProducts);
app.post('/shop/products', verifyToken, ShopController.createProduct);
app.put('/shop/products/:id', verifyToken, verifyAdmin, ShopController.updateProduct);
app.delete('/shop/products/:id', verifyToken, verifyAdmin, ShopController.deleteProduct);

// Order routes
app.post('/shop/orders', verifyToken, ShopController.createOrder);
app.get('/shop/admin/orders', verifyToken, verifyAdmin, ShopController.getAdminOrders);
app.get('/shop/orders', verifyToken, ShopController.getUserOrders);
app.put('/shop/orders/:id/status', verifyToken, verifyAdmin, ShopController.updateOrderStatus);

module.exports = app;
