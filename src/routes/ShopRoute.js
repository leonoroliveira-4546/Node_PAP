const express = require('express')
const app = express()

const ShopController = require('../controllers/ShopController')
const verifyToken = require('../middlewares/is_auth')
const verifyAdmin = require('../middlewares/is_admin')
const { upload } = require('../middlewares/upload')

app.get('/shop/products', verifyToken, ShopController.getProducts)
app.get('/shop/admin/products', verifyToken, verifyAdmin, ShopController.getAdminProducts)
app.get('/shop/my/products', verifyToken, ShopController.getMyProducts)
app.post('/shop/products', verifyToken, upload.single('file'), ShopController.createProduct)
app.put('/shop/products/:id', verifyToken, upload.single('file'), ShopController.updateProduct)
app.delete('/shop/products/:id', verifyToken, ShopController.deleteProduct)

app.post('/shop/checkout', verifyToken, ShopController.createCheckoutSession)

// Order routes
app.post('/shop/orders', verifyToken, ShopController.createOrder)
app.get('/shop/admin/orders', verifyToken, verifyAdmin, ShopController.getAdminOrders)
app.get('/shop/orders', verifyToken, ShopController.getUserOrders)
app.put('/shop/orders/:id/status', verifyToken, verifyAdmin, ShopController.updateOrderStatus)

module.exports = app
