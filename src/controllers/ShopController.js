const Product = require('../models/Shop/ProductModel');
const Order = require('../models/Shop/OrderModel');
const { uploadToCloudinary } = require('../middlewares/upload');

const ShopController = {
  getProducts: async (req, res) => {
    try {
      const filter = { published: true, status: 'aprovado' };
      if (req.query.availableForPraticinador === 'false') {
        filter.availableForPraticinador = false;
      }
      const products = await Product.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar produtos.' });
    }
  },

  getAdminProducts: async (req, res) => {
    try {
      const products = await Product.find().populate('createdBy', 'name username email').sort({ createdAt: -1 });
      return res.json({ success: true, products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar produtos.' });
    }
  },

  getMyProducts: async (req, res) => {
    try {
      const products = await Product.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
      return res.json({ success: true, products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar os seus produtos.' });
    }
  },

  createProduct: async (req, res) => {
    try {
      const { name, description, category, price, originalPrice, badge, image, quantity, availableForPraticinador, status } = req.body;
      let imageUrl = image;
      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer, 'products');
        imageUrl = uploaded.url;
      }
      const defaultStatus = req.user.type === 'admin' ? 'aprovado' : 'pendente';
      const product = await Product.create({
        name,
        description,
        category,
        price,
        originalPrice,
        quantity: quantity !== undefined ? Number(quantity) : 1,
        badge,
        image: imageUrl,
        inStock: quantity !== undefined ? Number(quantity) > 0 : true,
        published: true,
        status: status && req.user.type === 'admin' ? status : defaultStatus,
        availableForPraticinador: availableForPraticinador !== undefined ? Boolean(availableForPraticinador) : true,
        createdBy: req.user._id
      });
      return res.status(201).json({ success: true, product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar produto.' });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      }

      if (req.user.type !== 'admin' && product.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Não autorizado.' });
      }

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer, 'products');
        updates.image = uploaded.url;
      }

      if (updates.quantity !== undefined) {
        updates.quantity = Number(updates.quantity);
        updates.inStock = updates.quantity > 0;
      }

      const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
      return res.json({ success: true, product: updatedProduct });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar produto.' });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      }
      if (req.user.type !== 'admin' && product.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Não autorizado.' });
      }
      await Product.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Produto removido com sucesso.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao remover produto.' });
    }
  },

  // Order management methods
  createOrder: async (req, res) => {
    try {
      const { products, totalPrice } = req.body;
      const order = await Order.create({
        userId: req.user._id,
        products,
        totalPrice,
        status: 'pendente'
      });
      return res.status(201).json({ success: true, order });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao criar pedido.' });
    }
  },

  getAdminOrders: async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('userId', 'name email username')
        .populate('products.productId')
        .sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar pedidos.' });
    }
  },

  getUserOrders: async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.user._id })
        .populate('products.productId')
        .sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar pedidos.' });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pendente', 'aprovado', 'rejeitado', 'enviado', 'entregue'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status inválido.' });
      }

      const order = await Order.findByIdAndUpdate(id, { status, updatedAt: Date.now() }, { new: true })
        .populate('userId', 'name email username')
        .populate('products.productId');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
      }

      return res.json({ success: true, order });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar pedido.' });
    }
  }
};

module.exports = ShopController;
