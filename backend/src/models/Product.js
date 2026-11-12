const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockLevel: { type: Number, min: 0 },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, name: 1 }, { unique: true });
productSchema.index(
  { storeId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: "string" } } }
);

module.exports = mongoose.model("Product", productSchema);