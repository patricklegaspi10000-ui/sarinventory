const mongoose = require("mongoose");
const Product = require("../models/Product");
const Restock = require("../models/Restock");

exports.create = async (req, res) => {
  try {
    const { productId, quantity, newExpiryDate } = req.body;
    const qty = Number(quantity);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Choose a product" });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Enter a valid quantity" });
    }

    const update = { $inc: { quantity: qty } };
    if (newExpiryDate) update.$set = { expiryDate: newExpiryDate };

    const product = await Product.findOneAndUpdate(
      { _id: productId, storeId: req.user.storeId },
      update,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    let restock;
    try {
      restock = await Restock.create({
        storeId: req.user.storeId,
        productId: product._id,
        quantity: qty,
        newExpiryDate: newExpiryDate || undefined,
        receivedBy: req.user.id,
      });
    } catch (err) {
      await Product.updateOne({ _id: product._id }, { $inc: { quantity: -qty } });
      throw err;
    }

    res.status(201).json({ restock, quantity: product.quantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};