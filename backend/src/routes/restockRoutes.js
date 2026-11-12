const express = require("express");
const auth = require("../middleware/auth");
const { create } = require("../controllers/restockController");

const router = express.Router();

router.post("/", auth, create);

module.exports = router;