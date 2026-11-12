const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

categorySchema.index({ storeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);