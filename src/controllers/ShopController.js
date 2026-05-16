const Product = require('../models/Shop/ProductModel');

const ShopController = {
  getProducts: async (req, res) => {
    try {
      const filter = { published: true };
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
      const products = await Product.find().sort({ createdAt: -1 });
      return res.json({ success: true, products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar produtos.' });
    }
  },

  createProduct: async (req, res) => {
    try {
      const { name, description, category, price, originalPrice, badge, image, inStock, published, availableForPraticinador } = req.body;
      const product = await Product.create({
        name,
        description,
        category,
        price,
        originalPrice,
        badge,
        image,
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        published: published !== undefined ? Boolean(published) : true,
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
      const updates = req.body;
      const product = await Product.findByIdAndUpdate(id, updates, { new: true });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      }
      return res.json({ success: true, product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar produto.' });
    }
  }
};

module.exports = ShopController;
