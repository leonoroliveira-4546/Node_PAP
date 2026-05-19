const express = require('express');
const app = express();

const ShopController = require('../controllers/ShopController');
const verifyToken = require('../middlewares/is_auth');
const verifyAdmin = require('../middlewares/is_admin');

app.get('/shop/products', verifyToken, ShopController.getProducts);
app.get('/shop/admin/products', verifyToken, verifyAdmin, ShopController.getAdminProducts);
app.post('/shop/products', verifyToken, verifyAdmin, ShopController.createProduct);
app.put('/shop/products/:id', verifyToken, verifyAdmin, ShopController.updateProduct);

module.exports = app;
