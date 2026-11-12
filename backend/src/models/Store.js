const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    lowStockLevel: { type: Number, default: 5, min: 0 },
    expiryAlertDays: { type: Number, default: 7, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);