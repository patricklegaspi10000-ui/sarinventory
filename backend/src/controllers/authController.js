const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Store = require("../models/Store");
const User = require("../models/User");

function makeToken(user) {
  return jwt.sign(
    { id: user._id, storeId: user.storeId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
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

    const store = await Store.create({ name: storeName });
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