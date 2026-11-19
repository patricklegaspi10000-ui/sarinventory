const express = require("express");
const auth = require("../middleware/auth");
const { list } = require("../controllers/alertController");

const router = express.Router();

router.get("/", auth, list);

module.exports = router;