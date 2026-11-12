const express = require("express");
const auth = require("../middleware/auth");
const { summary } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/", auth, summary);

module.exports = router;