const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Store = require("../models/Store");
const User = require("../models/User");
const crypto = require("crypto");
const mongoose = require("mongoose");

function makeToken(user) {
  return jwt.sign(
    { id: user._id, storeId: user.storeId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
// Letters and numbers without look-alikes (no 0/O, 1/I)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function uniqueJoinCode() {
  for (let i = 0; i < 10; i++) {
    let code = "";
    for (const byte of crypto.randomBytes(6)) {
      code += CODE_CHARS[byte % CODE_CHARS.length];
    }
    if (!(await Store.exists({ joinCode: code }))) return code;
  }
  throw new Error("Could not make a store code");
}
exports.register = async (req, res) => {
  try {
    const { storeName, ownerName, username, password } = req.body;
    if (!storeName || !ownerName || !username || !password) {
      return res.status(400).json({ message: "Fill in all fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const taken = await User.findOne({ username: username.toLowerCase().trim() });
    if (taken) {
      return res.status(409).json({ message: "Username already taken" });
    }
    const store = await Store.create({
      name: storeName,
      joinCode: await uniqueJoinCode(),
    });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      storeId: store._id,
      name: ownerName,
      username,
      passwordHash,
      role: "owner",
    });

    res.status(201).json({ token: makeToken(user), name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Fill in all fields" });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({ token: makeToken(user), name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.registerHelper = async (req, res) => {
  try {
    const { name, username, password, storeCode } = req.body;
    if (!name || !username || !password || !storeCode) {
      return res.status(400).json({ message: "Fill in all fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const store = await Store.findOne({
      joinCode: String(storeCode).toUpperCase().trim(),
    });
    if (!store) {
      return res.status(404).json({ message: "Store code not found" });
    }

    const taken = await User.findOne({ username: username.toLowerCase().trim() });
    if (taken) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      storeId: store._id,
      name: name.trim(),
      username,
      passwordHash,
      role: "helper",
    });

    res.status(201).json({ token: makeToken(user), name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStoreCode = async (req, res) => {
  try {
    const store = await Store.findById(req.user.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    if (!store.joinCode) {
      store.joinCode = await uniqueJoinCode();
      await store.save();
    }
    res.json({ code: store.joinCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listStaff = async (req, res) => {
  try {
    const staff = await User.find({ storeId: req.user.storeId, role: "helper" })
      .select("name username createdAt")
      .sort("name");
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.resetHelperPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Helper not found" });
    }

    const helper = await User.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
      role: "helper",
    });
    if (!helper) return res.status(404).json({ message: "Helper not found" });

    helper.passwordHash = await bcrypt.hash(newPassword, 10);
    await helper.save();
    res.json({ message: "Password reset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name username role");
    if (!user) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    res.json({ name: user.name, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};