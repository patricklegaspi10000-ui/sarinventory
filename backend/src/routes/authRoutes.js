const express = require("express");
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");
const {
  register,
  login,
  registerHelper,
  getStoreCode,
  listStaff,
  resetHelperPassword,
} = require("../controllers/authController");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please try again shortly" },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/register-helper", loginLimiter, registerHelper);
router.get("/store-code", auth, requireOwner, getStoreCode);
router.get("/staff", auth, requireOwner, listStaff);
router.put("/staff/:id/password", auth, requireOwner, resetHelperPassword);

module.exports = router;