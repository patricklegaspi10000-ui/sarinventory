const mongoose = require("mongoose");
const Product = require("../models/Product");
const Store = require("../models/Store");

exports.list = async (req, res) => {
  try {
    const storeId = new mongoose.Types.ObjectId(req.user.storeId);
    const store = await Store.findById(storeId);
    const products = await Product.find({ storeId })
      .select("name quantity lowStockLevel expiryDate")
      .lean();

    const now = new Date();
    const limit = new Date(now.getTime() + store.expiryAlertDays * 24 * 60 * 60 * 1000);

    const lowStock = products
      .filter((p) => p.quantity <= (p.lowStockLevel ?? store.lowStockLevel))
      .sort((a, b) => a.quantity - b.quantity)
      .map((p) => ({
        id: p._id,
        name: p.name,
        quantity: p.quantity,
        level: p.lowStockLevel ?? store.lowStockLevel,
      }));

    const expiring = products
      .filter((p) => p.expiryDate && p.expiryDate <= limit)
      .sort((a, b) => a.expiryDate - b.expiryDate)
      .map((p) => ({
        id: p._id,
        name: p.name,
        quantity: p.quantity,
        expiryDate: p.expiryDate,
        expired: p.expiryDate < now,
      }));

    res.json({
      lowStock,
      expiring,
      settings: {
        lowStockLevel: store.lowStockLevel,
        expiryAlertDays: store.expiryAlertDays,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};