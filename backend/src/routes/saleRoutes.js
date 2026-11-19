const express = require("express");
const auth = require("../middleware/auth");
const { create, list } = require("../controllers/saleController");

const router = express.Router();

router.get("/", auth, list);
router.post("/", auth, create);

module.exports = router;