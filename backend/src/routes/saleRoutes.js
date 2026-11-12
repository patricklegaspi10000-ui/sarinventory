const express = require("express");
const auth = require("../middleware/auth");
const { create } = require("../controllers/saleController");

const router = express.Router();

router.post("/", auth, create);

module.exports = router;