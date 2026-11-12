const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login } = require("../controllers/authController");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please try again shortly" },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);

module.exports = router;