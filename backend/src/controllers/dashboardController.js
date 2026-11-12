const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Store = require("../models/Store");

exports.summary = async (req, res) => {
  try {
    const { storeId } = req.user;
    const store = await Store.findById(storeId);
    const storeLevel = store?.lowStockLevel ?? 5;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [products, todaySales] = await Promise.all([
      Product.find({ storeId }),
      Sale.find({ storeId, createdAt: { $gte: start } }),
    ]);

    const lowStock = products
      .filter((p) => p.quantity <= (p.lowStockLevel ?? storeLevel))
      .sort((a, b) => a.quantity - b.quantity)
      .map((p) => ({ id: p._id, name: p.name, quantity: p.quantity }));

    res.json({
      salesToday: todaySales.reduce((sum, s) => sum + s.total, 0),
      salesCount: todaySales.length,
      productCount: products.length,
      lowStock,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};