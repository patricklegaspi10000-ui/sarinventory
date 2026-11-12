const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "helper"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);