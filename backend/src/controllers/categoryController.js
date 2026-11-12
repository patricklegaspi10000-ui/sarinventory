const Category = require("../models/Category");
const Product = require("../models/Product");

exports.list = async (req, res) => {
  try {
    const categories = await Category.find({ storeId: req.user.storeId }).sort("name");
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await Category.create({ storeId: req.user.storeId, name });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, storeId: req.user.storeId },
      { name },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const inUse = await Product.countDocuments({
      storeId: req.user.storeId,
      categoryId: req.params.id,
    });
    if (inUse > 0) {
      return res.status(409).json({
        message: "Category is used by products. Reassign them first.",
      });
    }

    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      storeId: req.user.storeId,
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};      