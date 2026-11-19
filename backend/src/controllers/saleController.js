const mongoose = require("mongoose");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Store = require("../models/Store");

exports.create = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Choose a product" });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Enter a valid quantity" });
    }

    // Deduct stock only if there is enough, in one step
    const product = await Product.findOneAndUpdate(
      { _id: productId, storeId: req.user.storeId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true }
    );

    if (!product) {
      const exists = await Product.findOne({ _id: productId, storeId: req.user.storeId });
      if (!exists) return res.status(404).json({ message: "Product not found" });
      return res.status(400).json({ message: "Not enough stock" });
    }

    let sale;
    try {
      sale = await Sale.create({
        storeId: req.user.storeId,
        productId: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        total: qty * product.price,
        soldBy: req.user.id,
      });
    } catch (err) {
      // put the stock back if the sale could not be saved
      await Product.updateOne({ _id: product._id }, { $inc: { quantity: qty } });
      throw err;
    }

    const store = await Store.findById(req.user.storeId);
    const level = product.lowStockLevel ?? store.lowStockLevel;
    const lowStock = product.quantity <= level;

    res.status(201).json({ sale, lowStock, remaining: product.quantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.list = async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { storeId: new mongoose.Types.ObjectId(req.user.storeId) };

    // helpers only see the sales they recorded themselves
    if (req.user.role !== "owner") {
      filter.soldBy = new mongoose.Types.ObjectId(req.user.id);
    }

    if (period === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    }
    if (period === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    }

    const [sales, totals] = await Promise.all([
      Sale.find(filter).sort("-createdAt").limit(100).populate("soldBy", "name"),
      Sale.aggregate([
        { $match: filter },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$total" } } },
      ]),
    ]);

    res.json({
      sales,
      count: totals[0] ? totals[0].count : 0,
      revenue: totals[0] ? totals[0].revenue : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};