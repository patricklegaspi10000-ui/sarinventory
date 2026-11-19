const express = require("express");
const auth = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");
const { summary } = require("../controllers/reportController");

const router = express.Router();

router.get("/", auth, requireOwner, summary);

module.exports = router;