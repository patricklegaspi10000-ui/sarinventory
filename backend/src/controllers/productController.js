const Product = require("../models/Product");
const Category = require("../models/Category");
const Store = require("../models/Store");

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function checkCategory(storeId, categoryId) {
  if (!categoryId) return true;
  const found = await Category.findOne({ _id: categoryId, storeId });
  return !!found;
}

exports.list = async (req, res) => {
  try {
    const { search, filter } = req.query;
    const store = await Store.findById(req.user.storeId);
    const query = { storeId: req.user.storeId };

    if (search) {
      query.name = { $regex: escapeRegex(search), $options: "i" };
    }
    if (filter === "low") {
      query.$expr = {
        $lte: ["$quantity", { $ifNull: ["$lowStockLevel", store.lowStockLevel] }],
      };
    }
    if (filter === "expiring") {
      query.expiryDate = {
        $lte: new Date(Date.now() + store.expiryAlertDays * 24 * 60 * 60 * 1000),
      };
    }

    const products = await Product.find(query)
      .populate("categoryId", "name")
      .sort("name");
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      storeId: req.user.storeId,
      barcode: req.params.code.trim(),
    }).populate("categoryId", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, barcode, categoryId, price, quantity, lowStockLevel, expiryDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }
    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ message: "Enter a valid price" });
    }
    if (quantity !== undefined && (isNaN(quantity) || Number(quantity) < 0)) {
      return res.status(400).json({ message: "Enter a valid quantity" });
    }
    if (!(await checkCategory(req.user.storeId, categoryId))) {
      return res.status(400).json({ message: "Category not found" });
    }

    const product = await Product.create({
      storeId: req.user.storeId,
      name: name.trim(),
      barcode: barcode && barcode.trim() ? barcode.trim() : undefined,
      categoryId: categoryId || undefined,
      price,
      quantity: quantity || 0,
      lowStockLevel: lowStockLevel === "" ? undefined : lowStockLevel,
      expiryDate: expiryDate || undefined,
    });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Product name or barcode already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, barcode, categoryId, price, quantity, lowStockLevel, expiryDate } = req.body;

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: "Product name is required" });
      product.name = name.trim();
    }
    if (barcode !== undefined) {
      product.barcode = barcode && barcode.trim() ? barcode.trim() : undefined;
    }
    if (categoryId !== undefined) {
      if (!(await checkCategory(req.user.storeId, categoryId))) {
        return res.status(400).json({ message: "Category not found" });
      }
      product.categoryId = categoryId || undefined;
    }
    if (price !== undefined) {
      if (isNaN(price) || Number(price) < 0) {
        return res.status(400).json({ message: "Enter a valid price" });
      }
      product.price = price;
    }
    if (quantity !== undefined) {
      if (isNaN(quantity) || Number(quantity) < 0) {
        return res.status(400).json({ message: "Enter a valid quantity" });
      }
      product.quantity = quantity;
    }
    if (lowStockLevel !== undefined) {
      product.lowStockLevel = lowStockLevel === "" ? undefined : lowStockLevel;
    }
    if (expiryDate !== undefined) {
      product.expiryDate = expiryDate || undefined;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Product name or barcode already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      storeId: req.user.storeId,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};